package com.digitaldynamics.pms.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.UserRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {
    @Mock
    private UserRepository userRepository;

    private UserDetailsServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserDetailsServiceImpl(userRepository);
    }

    @Test
    void loadsUserFromDatabaseByNormalizedEmail() {
        User user = user("buyer@example.com", AccountStatus.ACTIVE, UserRole.REQUESTER);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername(" Buyer@Example.com ");

        assertThat(details.getUsername()).isEqualTo("buyer@example.com");
        assertThat(details.getPassword()).isEqualTo("encoded-password");
        verify(userRepository).findByEmail("buyer@example.com");
    }

    @Test
    void mapsUserRolesToSpringSecurityAuthorities() {
        User user = user("admin@example.com", AccountStatus.ACTIVE,
                UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("admin@example.com");

        assertThat(details.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_PROCUREMENT_OFFICER");
    }

    @Test
    void throwsWhenUserDoesNotExist() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("missing@example.com");
    }

    @Test
    void inactiveUsersAreDisabled() {
        User user = user("inactive@example.com", AccountStatus.INACTIVE, UserRole.REQUESTER);
        when(userRepository.findByEmail("inactive@example.com")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("inactive@example.com");

        assertThat(details.isEnabled()).isFalse();
        assertThat(details.isAccountNonLocked()).isTrue();
    }

    @Test
    void lockedUsersAreAccountLocked() {
        User user = user("locked@example.com", AccountStatus.LOCKED, UserRole.REQUESTER);
        when(userRepository.findByEmail("locked@example.com")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("locked@example.com");

        assertThat(details.isEnabled()).isTrue();
        assertThat(details.isAccountNonLocked()).isFalse();
    }

    private User user(String email, AccountStatus status, UserRole... roles) {
        User user = new User();
        user.setEmail(email);
        user.setFullName("Test User");
        user.setPasswordHash("encoded-password");
        user.setStatus(status);
        user.setRoles(Set.of(roles));
        return user;
    }
}
