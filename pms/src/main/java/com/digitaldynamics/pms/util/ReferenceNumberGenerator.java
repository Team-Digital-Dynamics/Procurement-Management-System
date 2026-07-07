package com.digitaldynamics.pms.util;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class ReferenceNumberGenerator {

    private static final Set<String> ALLOWED_PREFIXES = Set.of("REQ", "RFQ", "PO");

    private final Map<String, AtomicInteger> yearlySequences = new ConcurrentHashMap<>();

    public String generateReference(String prefix) {
        String normalizedPrefix = normalizePrefix(prefix);
        int year = LocalDate.now().getYear();
        String sequenceKey = normalizedPrefix + "-" + year;

        int counter = yearlySequences
                .computeIfAbsent(sequenceKey, key -> new AtomicInteger(0))
                .incrementAndGet();

        return "%s-%d-%04d".formatted(normalizedPrefix, year, counter);
    }

    private static String normalizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            throw new IllegalArgumentException("Reference prefix is required");
        }

        String normalized = prefix.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_PREFIXES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported reference prefix: " + normalized);
        }

        return normalized;
    }
}
