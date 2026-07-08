package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.ApprovalThreshold;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalThresholdRepository extends JpaRepository<ApprovalThreshold, Long> {

    List<ApprovalThreshold> findAllByOrderByLevelAsc();

    Optional<ApprovalThreshold> findByLevel(int level);

    boolean existsByLevel(int level);
}