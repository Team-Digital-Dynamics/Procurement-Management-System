package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.Supplier;
import com.digitaldynamics.pms.model.SupplierStatus;
import com.digitaldynamics.pms.repository.SupplierRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditService auditService;

    public SupplierService(SupplierRepository supplierRepository, AuditService auditService) {
        this.supplierRepository = supplierRepository;
        this.auditService = auditService;
    }

    @Transactional
    public SupplierResponse registerSupplier(SupplierRequest request, String actor) {
        if (supplierRepository.existsByContactEmail(request.contactEmail().toLowerCase())) {
            throw new ApiException(HttpStatus.CONFLICT, "Supplier email already exists");
        }
        Supplier supplier = new Supplier();
        supplier.setName(request.name());
        supplier.setContactEmail(request.contactEmail().toLowerCase());
        supplier.setPhone(request.phone());
        supplier.setTaxNumber(request.taxNumber());
        supplierRepository.save(supplier);
        auditService.record(actor, "REGISTER_SUPPLIER", "Supplier", supplier.getId(), "Supplier registered");
        return toResponse(supplier);
    }

    @Transactional
    public SupplierResponse setApprovalStatus(Long id, SupplierStatus status, String actor) {
        Supplier supplier = findById(id);
        supplier.setStatus(status);
        auditService.record(actor, "SET_SUPPLIER_STATUS", "Supplier", id, "Supplier status changed to " + status);
        return toResponse(supplier);
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplier(Long id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliers() {
        return supplierRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliersByStatus(SupplierStatus status) {
        return supplierRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    private Supplier findById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Supplier not found"));
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getContactEmail(),
                supplier.getStatus(), supplier.getPerformanceScore());
    }
}
