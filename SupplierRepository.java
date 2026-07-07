package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.Supplier;
import com.digitaldynamics.pms.model.SupplierStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByContactEmail(String contactEmail);
    boolean existsByContactEmail(String contactEmail);
    List<Supplier> findByStatus(SupplierStatus status);
}
