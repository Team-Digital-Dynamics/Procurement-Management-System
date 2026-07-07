package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "roles")
    List<User> findAll();

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRolesContaining(UserRole role);
}