package com.digitaldynamics.pms.config;

import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.UserRepository;
import java.math.BigDecimal;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seedUsers(UserRepository users, PasswordEncoder encoder) {
        return args -> {
            seed(users, encoder, "admin@digitaldynamics.co.za", "System Administrator",
                    Set.of(UserRole.ADMIN), BigDecimal.valueOf(1000000));
            seed(users, encoder, "procurement@digitaldynamics.co.za", "Procurement Officer",
                    Set.of(UserRole.PROCUREMENT_OFFICER), BigDecimal.ZERO);
            seed(users, encoder, "requester@digitaldynamics.co.za", "Requester User",
                    Set.of(UserRole.REQUESTER), BigDecimal.ZERO);
            seed(users, encoder, "approver1@digitaldynamics.co.za", "Level 1 Approver",
                    Set.of(UserRole.APPROVER_LEVEL_1), BigDecimal.valueOf(25000));
            seed(users, encoder, "approver2@digitaldynamics.co.za", "Level 2 Approver",
                    Set.of(UserRole.APPROVER_LEVEL_2), BigDecimal.valueOf(100000));
            seed(users, encoder, "approver3@digitaldynamics.co.za", "Level 3 Approver",
                    Set.of(UserRole.APPROVER_LEVEL_3), BigDecimal.valueOf(1000000));
            seed(users, encoder, "receiving@digitaldynamics.co.za", "Receiving Clerk",
                    Set.of(UserRole.RECEIVING_CLERK), BigDecimal.ZERO);
        };
    }

    private void seed(UserRepository users, PasswordEncoder encoder, String email, String name,
                      Set<UserRole> roles, BigDecimal limit) {
        if (users.existsByEmail(email)) {
            return;
        }
        User user = new User();
        user.setEmail(email);
        user.setFullName(name);
        user.setPasswordHash(encoder.encode("Password123!"));
        user.setStatus(AccountStatus.ACTIVE);
        user.setRoles(roles);
        user.setApprovalLimit(limit);
        users.save(user);
    }
}
