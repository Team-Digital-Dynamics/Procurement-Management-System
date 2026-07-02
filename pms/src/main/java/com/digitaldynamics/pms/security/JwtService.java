package com.digitaldynamics.pms.security;

import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final ObjectMapper objectMapper;
    private final String secret;
    private final long expirationMinutes;

    public JwtService(ObjectMapper objectMapper,
                      @Value("${pms.jwt.secret}") String secret,
                      @Value("${pms.jwt.expiration-minutes}") long expirationMinutes) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.expirationMinutes = expirationMinutes;
    }

    public String create(User user) {
        try {
            String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
            List<String> roles = user.getRoles().stream().map(Enum::name).sorted().toList();
            String payload = encodeJson(Map.of(
                    "sub", user.getEmail(),
                    "uid", user.getId(),
                    "name", user.getFullName(),
                    "roles", roles,
                    "exp", Instant.now().plusSeconds(expirationMinutes * 60).getEpochSecond()
            ));
            String unsigned = header + "." + payload;
            return unsigned + "." + sign(unsigned);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not create token", ex);
        }
    }

    public CurrentUser parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
                return null;
            }
            Map<String, Object> claims = objectMapper.readValue(Base64.getUrlDecoder().decode(parts[1]),
                    new TypeReference<>() {
                    });
            Number exp = (Number) claims.get("exp");
            if (exp.longValue() < Instant.now().getEpochSecond()) {
                return null;
            }
            @SuppressWarnings("unchecked")
            List<String> roleNames = (List<String>) claims.get("roles");
            Set<UserRole> roles = roleNames.stream().map(UserRole::valueOf).collect(Collectors.toSet());
            return new CurrentUser(((Number) claims.get("uid")).longValue(), (String) claims.get("sub"),
                    (String) claims.get("name"), roles);
        } catch (Exception ex) {
            return null;
        }
    }

    private String encodeJson(Object value) throws Exception {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }
}
