package com.digitaldynamics.pms.security;

import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.UserRepository;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizedEmail = normalizeEmail(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + normalizedEmail));

        Set<GrantedAuthority> authorities = user.getRoles().stream()
                .filter(Objects::nonNull)
                .map(role -> "ROLE_" + role.name())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());

        AccountStatus status = user.getStatus();

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .disabled(status == AccountStatus.INACTIVE)
                .accountLocked(status == AccountStatus.LOCKED)
                .accountExpired(false)
                .credentialsExpired(false)
                .build();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new UsernameNotFoundException("User email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
