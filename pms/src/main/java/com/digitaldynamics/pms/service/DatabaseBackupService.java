package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.config.BackupProperties;
import com.digitaldynamics.pms.dto.BackupDtos.BackupResult;
import com.digitaldynamics.pms.dto.BackupDtos.BackupSummary;
import com.digitaldynamics.pms.dto.BackupDtos.BackupVerificationResult;
import com.digitaldynamics.pms.dto.BackupDtos.RestoreResult;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Clob;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DatabaseBackupService {
    private static final DateTimeFormatter FILE_TIMESTAMP =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS").withZone(ZoneOffset.UTC);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    private final BackupProperties properties;

    public DatabaseBackupService(DataSource dataSource, JdbcTemplate jdbcTemplate, BackupProperties properties) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
        this.properties = properties;
    }

    public BackupResult createBackup(String source) {
        try {
            Path directory = backupDirectory();
            Files.createDirectories(directory);

            Instant createdAt = Instant.now();
            Path backupFile = directory.resolve("pms-backup-" + FILE_TIMESTAMP.format(createdAt) + ".sql");
            BackupStats stats = writeBackup(backupFile, source, createdAt);
            String checksum = sha256(backupFile);
            Files.writeString(checksumFile(backupFile), checksum, StandardCharsets.UTF_8);

            return new BackupResult(
                    backupFile.getFileName().toString(),
                    checksum,
                    Files.size(backupFile),
                    stats.tableCount(),
                    stats.rowCount(),
                    createdAt,
                    source
            );
        } catch (IOException | SQLException ex) {
            throw new IllegalStateException("Database backup failed", ex);
        }
    }

    public List<BackupSummary> listBackups() {
        try {
            Path directory = backupDirectory();
            if (!Files.exists(directory)) {
                return List.of();
            }
            try (var stream = Files.list(directory)) {
                return stream
                        .filter(path -> path.getFileName().toString().endsWith(".sql"))
                        .sorted(Comparator.comparing(this::lastModified).reversed())
                        .map(this::toSummary)
                        .toList();
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to list database backups", ex);
        }
    }

    @Transactional
    public RestoreResult restoreBackup(String fileName) {
        Path backupFile = resolveBackupFile(fileName);
        BackupVerificationResult verification = verifyBackup(fileName);
        if (!verification.checksumMatches()) {
            throw new IllegalStateException("Backup checksum verification failed");
        }

        try {
            String sql = Files.readString(backupFile, StandardCharsets.UTF_8);
            List<String> statements = splitStatements(sql);

            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                boolean previousAutoCommit = connection.getAutoCommit();
                connection.setAutoCommit(false);
                int executed = 0;
                try {
                    setReferentialIntegrity(connection, false);
                    for (String item : statements) {
                        String executable = removeLineComments(item);
                        if (isExecutableStatement(executable)) {
                            statement.execute(executable);
                            executed++;
                        }
                    }
                    connection.commit();
                } catch (SQLException | RuntimeException ex) {
                    connection.rollback();
                    throw ex;
                } finally {
                    try {
                        setReferentialIntegrity(connection, true);
                    } finally {
                        connection.setAutoCommit(previousAutoCommit);
                    }
                }

                return new RestoreResult(
                        backupFile.getFileName().toString(),
                        verification.actualChecksum(),
                        Instant.now(),
                        executed
                );
            }
        } catch (IOException | SQLException ex) {
            throw new IllegalStateException("Database restore failed", ex);
        }
    }

    public BackupVerificationResult verifyBackup(String fileName) {
        Path backupFile = resolveBackupFile(fileName);
        try {
            String storedChecksum = readStoredChecksum(backupFile);
            String actualChecksum = sha256(backupFile);
            String sql = Files.readString(backupFile, StandardCharsets.UTF_8);
            List<String> statements = splitStatements(sql).stream()
                    .map(this::removeLineComments)
                    .filter(this::isExecutableStatement)
                    .toList();
            int insertStatements = (int) statements.stream()
                    .filter(statement -> statement.stripLeading().toUpperCase().startsWith("INSERT INTO"))
                    .count();

            return new BackupVerificationResult(
                    backupFile.getFileName().toString(),
                    storedChecksum.equalsIgnoreCase(actualChecksum),
                    storedChecksum,
                    actualChecksum,
                    Files.size(backupFile),
                    Instant.now(),
                    statements.size(),
                    insertStatements
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to verify database backup", ex);
        }
    }

    private BackupStats writeBackup(Path backupFile, String source, Instant createdAt) throws SQLException, IOException {
        try (Connection connection = dataSource.getConnection();
             BufferedWriter writer = Files.newBufferedWriter(backupFile, StandardCharsets.UTF_8)) {
            List<TableRef> tables = applicationTables(connection);
            long totalRows = 0;

            writer.write("-- Procurement Management System database backup\n");
            writer.write("-- Source: " + source + "\n");
            writer.write("-- Created at UTC: " + createdAt + "\n\n");

            for (int index = tables.size() - 1; index >= 0; index--) {
                writer.write("DELETE FROM " + quote(tables.get(index).name()) + ";\n");
            }
            writer.write("\n");

            for (TableRef table : tables) {
                List<String> columns = columns(connection, table);
                long rows = writeTableRows(writer, table, columns);
                totalRows += rows;
            }

            return new BackupStats(tables.size(), totalRows);
        }
    }

    private long writeTableRows(BufferedWriter writer, TableRef table, List<String> columns) throws IOException {
        String selectSql = "SELECT " + columns.stream().map(this::quote).reduce((a, b) -> a + ", " + b).orElse("*")
                + " FROM " + quote(table.name());
        String insertPrefix = "INSERT INTO " + quote(table.name()) + " ("
                + columns.stream().map(this::quote).reduce((a, b) -> a + ", " + b).orElse("")
                + ") VALUES ";

        final long[] rows = {0};
        try {
            jdbcTemplate.query(selectSql, rs -> {
                List<String> values = new ArrayList<>();
                for (int i = 1; i <= columns.size(); i++) {
                    values.add(sqlLiteral(rs.getObject(i)));
                }
                try {
                    writer.write(insertPrefix + "(" + String.join(", ", values) + ");\n");
                } catch (IOException ex) {
                    throw new UncheckedIOException(ex);
                }
                rows[0]++;
            });
        } catch (UncheckedIOException ex) {
            throw ex.getCause();
        }
        writer.write("\n");
        return rows[0];
    }

    private List<TableRef> applicationTables(Connection connection) throws SQLException {
        DatabaseMetaData metaData = connection.getMetaData();
        List<TableRef> tables = new ArrayList<>();
        String catalog = connection.getCatalog();
        String schema = connection.getSchema();

        try (ResultSet rs = metaData.getTables(catalog, schema, "%", new String[]{"TABLE"})) {
            while (rs.next()) {
                TableRef table = new TableRef(rs.getString("TABLE_CAT"), rs.getString("TABLE_SCHEM"),
                        rs.getString("TABLE_NAME"));
                if (isApplicationTable(table)) {
                    tables.add(table);
                }
            }
        }

        if (tables.isEmpty()) {
            try (ResultSet rs = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    TableRef table = new TableRef(rs.getString("TABLE_CAT"), rs.getString("TABLE_SCHEM"),
                            rs.getString("TABLE_NAME"));
                    if (isApplicationTable(table)) {
                        tables.add(table);
                    }
                }
            }
        }

        tables.sort(Comparator.comparing(table -> table.name().toLowerCase()));
        return tables;
    }

    private boolean isApplicationTable(TableRef table) {
        String schema = table.schema() == null ? "" : table.schema();
        String name = table.name();
        return name != null
                && !name.equalsIgnoreCase("flyway_schema_history")
                && !schema.equalsIgnoreCase("information_schema")
                && !schema.equalsIgnoreCase("performance_schema")
                && !schema.equalsIgnoreCase("mysql")
                && !schema.equalsIgnoreCase("sys");
    }

    private List<String> columns(Connection connection, TableRef table) throws SQLException {
        List<String> columns = new ArrayList<>();
        DatabaseMetaData metaData = connection.getMetaData();
        try (ResultSet rs = metaData.getColumns(table.catalog(), table.schema(), table.name(), "%")) {
            while (rs.next()) {
                columns.add(rs.getString("COLUMN_NAME"));
            }
        }
        return columns;
    }

    private String sqlLiteral(Object value) throws SQLException {
        if (value == null) {
            return "NULL";
        }
        if (value instanceof Number || value instanceof BigDecimal) {
            return value.toString();
        }
        if (value instanceof Boolean bool) {
            return bool ? "TRUE" : "FALSE";
        }
        if (value instanceof Timestamp timestamp) {
            return "'" + timestamp.toLocalDateTime() + "'";
        }
        if (value instanceof Date date) {
            return "'" + date.toLocalDate() + "'";
        }
        if (value instanceof Time time) {
            return "'" + time.toLocalTime() + "'";
        }
        if (value instanceof byte[] bytes) {
            return "X'" + HexFormat.of().formatHex(bytes) + "'";
        }
        if (value instanceof Clob clob) {
            return quoteString(clob.getSubString(1, Math.toIntExact(clob.length())));
        }
        return quoteString(value.toString());
    }

    private String quoteString(String value) {
        return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'";
    }

    private String quote(String identifier) {
        return "`" + identifier.replace("`", "``") + "`";
    }

    private Path backupDirectory() {
        return Path.of(properties.getDirectory()).toAbsolutePath().normalize();
    }

    private Path resolveBackupFile(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("Backup file name is required");
        }
        Path directory = backupDirectory();
        Path backupFile = directory.resolve(fileName).normalize();
        if (!backupFile.startsWith(directory) || !backupFile.getFileName().toString().endsWith(".sql")) {
            throw new IllegalArgumentException("Invalid backup file name");
        }
        if (!Files.exists(backupFile)) {
            throw new IllegalArgumentException("Backup file does not exist: " + fileName);
        }
        return backupFile;
    }

    private Path checksumFile(Path backupFile) {
        return backupFile.resolveSibling(backupFile.getFileName() + ".sha256");
    }

    private String readStoredChecksum(Path backupFile) {
        try {
            Path checksum = checksumFile(backupFile);
            if (!Files.exists(checksum)) {
                throw new IllegalStateException("Backup checksum file is missing");
            }
            return Files.readString(checksum, StandardCharsets.UTF_8).trim();
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to read backup checksum", ex);
        }
    }

    private String sha256(Path path) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(Files.readAllBytes(path));
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to calculate backup checksum", ex);
        }
    }

    private BackupSummary toSummary(Path backupFile) {
        String checksum = Files.exists(checksumFile(backupFile)) ? readStoredChecksum(backupFile) : "";
        try {
            return new BackupSummary(
                    backupFile.getFileName().toString(),
                    checksum,
                    Files.size(backupFile),
                    Files.getLastModifiedTime(backupFile).toInstant()
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to read backup metadata", ex);
        }
    }

    private Instant lastModified(Path path) {
        try {
            return Files.getLastModifiedTime(path).toInstant();
        } catch (IOException ex) {
            return Instant.EPOCH;
        }
    }

    private void setReferentialIntegrity(Connection connection, boolean enabled) throws SQLException {
        String product = connection.getMetaData().getDatabaseProductName().toLowerCase();
        try (Statement statement = connection.createStatement()) {
            if (product.contains("h2")) {
                statement.execute("SET REFERENTIAL_INTEGRITY " + (enabled ? "TRUE" : "FALSE"));
            } else if (product.contains("mysql") || product.contains("mariadb")) {
                statement.execute("SET FOREIGN_KEY_CHECKS=" + (enabled ? "1" : "0"));
            }
        }
    }

    private List<String> splitStatements(String sql) {
        List<String> statements = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inString = false;

        for (int i = 0; i < sql.length(); i++) {
            char ch = sql.charAt(i);
            if (ch == '\'' && (i + 1 >= sql.length() || sql.charAt(i + 1) != '\'')) {
                inString = !inString;
            }
            if (ch == ';' && !inString) {
                statements.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        if (!current.isEmpty()) {
            statements.add(current.toString().trim());
        }
        return statements;
    }

    private boolean isExecutableStatement(String statement) {
        if (statement == null || statement.isBlank()) {
            return false;
        }
        String trimmed = statement.stripLeading();
        return !trimmed.startsWith("--");
    }

    private String removeLineComments(String statement) {
        StringBuilder cleaned = new StringBuilder();
        for (String line : statement.split("\\R")) {
            String trimmed = line.stripLeading();
            if (!trimmed.startsWith("--")) {
                cleaned.append(line).append('\n');
            }
        }
        return cleaned.toString().trim();
    }

    private record TableRef(String catalog, String schema, String name) {
    }

    private record BackupStats(int tableCount, long rowCount) {
    }
}
