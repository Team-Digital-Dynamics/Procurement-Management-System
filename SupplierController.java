package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierResponse;
import com.digitaldynamics.pms.model.SupplierStatus;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.SupplierService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    List<SupplierResponse> list(@RequestParam(required = false) SupplierStatus status) {
        return status != null ? supplierService.listSuppliersByStatus(status) : supplierService.listSuppliers();
    }

    @GetMapping("/{id}")
    SupplierResponse get(@PathVariable Long id) {
        return supplierService.getSupplier(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_OFFICER')")
    SupplierResponse create(@Valid @RequestBody SupplierRequest request,
            @AuthenticationPrincipal CurrentUser user) {
        return supplierService.registerSupplier(request, user.email());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_OFFICER')")
    SupplierResponse setStatus(@PathVariable Long id, @RequestParam SupplierStatus status,
            @AuthenticationPrincipal CurrentUser user) {
        return supplierService.setApprovalStatus(id, status, user.email());
    }
}
