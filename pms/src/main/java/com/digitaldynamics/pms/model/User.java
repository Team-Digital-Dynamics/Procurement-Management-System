package com.digitaldynamics.pms.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Collections;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Transient
    @Column(length = 80)
    private String department;

    @Transient
    @Column(length = 80)
    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "approval_limit", nullable = false, precision = 14, scale = 2)
    private BigDecimal approvalLimit = BigDecimal.ZERO;

    @ElementCollection
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 40)
    private Set<UserRole> roles = new HashSet<>();

    public User() {
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getUserId() {
        return id;
    }

    public void setUserId(Long userId) {
        this.id = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getCreatedDate() {
        return createdAt;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdAt = createdDate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        if (roles == null || roles.isEmpty()) {
            return null;
        }
        return toRole(roles.iterator().next());
    }

    public void setRole(Role role) {
        if (role == null) {
            this.roles = new HashSet<>();
            return;
        }
        this.roles = new HashSet<>(Set.of(toUserRole(role)));
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public int getFailedLogins() {
        return failedLoginAttempts;
    }

    public void setFailedLogins(int failedLogins) {
        this.failedLoginAttempts = failedLogins;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getFailedLoginAttempts() {
        return failedLoginAttempts;
    }

    public void setFailedLoginAttempts(int failedLoginAttempts) {
        this.failedLoginAttempts = failedLoginAttempts;
    }

    public BigDecimal getApprovalLimit() {
        return approvalLimit;
    }

    public void setApprovalLimit(BigDecimal approvalLimit) {
        this.approvalLimit = approvalLimit;
    }

    public Set<UserRole> getRoles() {
        if (roles == null) {
            return Collections.emptySet();
        }
        return roles;
    }

    public void setRoles(Set<UserRole> roles) {
        this.roles = roles == null ? new HashSet<>() : new HashSet<>(roles);
    }

    private static Role toRole(UserRole userRole) {
        return switch (userRole) {
            case REQUESTER -> Role.REQUESTOR;
            case PROCUREMENT_OFFICER -> Role.PROCUREMENT_OFFICER;
            case APPROVER_LEVEL_1, APPROVER_LEVEL_2, APPROVER_LEVEL_3 -> Role.APPROVER;
            case RECEIVING_CLERK -> Role.FINANCE;
            case SUPPLIER -> Role.SUPPLIER;
            case ADMIN -> Role.ADMINISTRATOR;
        };
    }

    private static UserRole toUserRole(Role role) {
        return switch (role) {
            case REQUESTOR -> UserRole.REQUESTER;
            case PROCUREMENT_OFFICER -> UserRole.PROCUREMENT_OFFICER;
            case APPROVER -> UserRole.APPROVER_LEVEL_1;
            case FINANCE -> UserRole.RECEIVING_CLERK;
            case SUPPLIER -> UserRole.SUPPLIER;
            case ADMINISTRATOR -> UserRole.ADMIN;
            case AUDITOR -> UserRole.ADMIN;
        };
    }
}
