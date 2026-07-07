package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.CreatePurchaseOrderRequestDTO;
import com.digitaldynamics.pms.dto.PurchaseOrderDTO;
import com.digitaldynamics.pms.enums.PurchaseOrderStatus;
import com.digitaldynamics.pms.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    /**
     * POST /api/purchase-orders
     * Create a Purchase Order (PO) after supplier selection
     * Role: PROCUREMENT_OFFICER
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'ADMINISTRATOR')")
    public ResponseEntity<PurchaseOrderDTO> createPurchaseOrder(
            @Valid @RequestBody CreatePurchaseOrderRequestDTO requestDTO) {
        PurchaseOrderDTO created = purchaseOrderService.createPurchaseOrder(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/purchase-orders/{id}
     * Get Purchase Order details by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'SUPPLIER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<PurchaseOrderDTO> getPurchaseOrderById(@PathVariable Long id) {
        return purchaseOrderService.getPurchaseOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/purchase-orders/reference/{referenceNo}
     * Get Purchase Order by reference number
     */
    @GetMapping("/reference/{referenceNo}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'SUPPLIER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<PurchaseOrderDTO> getPurchaseOrderByReference(@PathVariable String referenceNo) {
        return purchaseOrderService.getPurchaseOrderByReferenceNo(referenceNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/purchase-orders
     * List Purchase Orders with pagination and optional filtering by status
     * Query params: page, limit, status
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'SUPPLIER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> listPurchaseOrders(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) PurchaseOrderStatus status) {
        
        log.info("Fetching purchase orders: page={}, limit={}, status={}", page, limit, status);
        
        // Convert 1-based page to 0-based for Spring Data
        int pageIndex = Math.max(0, page - 1);
        Pageable pageable = PageRequest.of(pageIndex, limit);
        
        Map<String, Object> result = purchaseOrderService.listPurchaseOrdersPaginated(status, pageable);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/purchase-orders/{id}/issue
     * Issue a Purchase Order (send to supplier)
     * Role: PROCUREMENT_OFFICER
     */
    @PostMapping("/{id}/issue")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'ADMINISTRATOR')")
    public ResponseEntity<PurchaseOrderDTO> issuePurchaseOrder(@PathVariable Long id) {
        try {
            PurchaseOrderDTO issued = purchaseOrderService.issuePurchaseOrder(id);
            return ResponseEntity.ok(issued);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/purchase-orders/{id}/status
     * Update Purchase Order status
     * Role: PROCUREMENT_OFFICER or FINANCE
     * Request body: { "status": "IN_TRANSIT" }
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<PurchaseOrderDTO> updatePurchaseOrderStatus(
            @PathVariable Long id,
            @RequestParam PurchaseOrderStatus status) {
        try {
            PurchaseOrderDTO updated = purchaseOrderService.updatePurchaseOrderStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/purchase-orders/supplier/{supplierId}
     * Get all Purchase Orders for a specific supplier
     * Role: SUPPLIER
     */
    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMINISTRATOR')")
    public ResponseEntity<List<PurchaseOrderDTO>> getSupplierPurchaseOrders(@PathVariable Long supplierId) {
        try {
            List<PurchaseOrderDTO> pos = purchaseOrderService.getSupplierPurchaseOrders(supplierId);
            return ResponseEntity.ok(pos);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

