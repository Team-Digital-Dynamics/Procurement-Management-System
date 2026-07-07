// Fresh GRN Controller Upload Sprint-4-GRN-Implementation


package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.CreateGRNRequestDTO;
import com.digitaldynamics.pms.dto.GRNDTO;
import com.digitaldynamics.pms.enums.GRNStatus;
import com.digitaldynamics.pms.service.GRNService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/grns")
@RequiredArgsConstructor
public class GRNController {

    private final GRNService grnService;

    /**
     * POST /api/grns
     * Create a Goods Received Note (GRN) when goods are received
     * Role: PROCUREMENT_OFFICER or WAREHOUSE
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<GRNDTO> createGRN(
            @Valid @RequestBody CreateGRNRequestDTO requestDTO) {
        GRNDTO created = grnService.createGRN(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/grns/{id}
     * Get GRN details by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<GRNDTO> getGRNById(@PathVariable Long id) {
        return grnService.getGRNById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/grns/reference/{referenceNo}
     * Get GRN by reference number
     */
    @GetMapping("/reference/{referenceNo}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<GRNDTO> getGRNByReference(@PathVariable String referenceNo) {
        return grnService.getGRNByReferenceNo(referenceNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/grns
     * List GRNs with optional filtering by status
     * Query params: status
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<List<GRNDTO>> listGRNs(
            @RequestParam(required = false) GRNStatus status) {
        List<GRNDTO> grns = grnService.listGRNs(status);
        return ResponseEntity.ok(grns);
    }

    /**
     * POST /api/grns/{id}/receive
     * Mark goods as received
     */
    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<GRNDTO> receiveGoods(@PathVariable Long id) {
        try {
            GRNDTO received = grnService.receiveGoods(id);
            return ResponseEntity.ok(received);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/grns/{id}/inspect
     * Mark goods as inspected and set inspection result
     * Query params: inspectionResult (PASSED, FAILED, CONDITIONAL), inspectedBy
     */
    @PostMapping("/{id}/inspect")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<GRNDTO> inspectGoods(
            @PathVariable Long id,
            @RequestParam String inspectionResult,
            @RequestParam String inspectedBy) {
        try {
            GRNDTO inspected = grnService.inspectGoods(id, inspectionResult, inspectedBy);
            return ResponseEntity.ok(inspected);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/grns/{id}/accept
     * Accept goods (record quantities accepted and rejected)
     * Query params: quantityAccepted, quantityRejected
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<GRNDTO> acceptGoods(
            @PathVariable Long id,
            @RequestParam Integer quantityAccepted,
            @RequestParam Integer quantityRejected) {
        try {
            GRNDTO accepted = grnService.acceptGoods(id, quantityAccepted, quantityRejected);
            return ResponseEntity.ok(accepted);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/grns/po/{poId}
     * Get all GRNs for a specific Purchase Order
     */
    @GetMapping("/po/{poId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<List<GRNDTO>> getPurchaseOrderGRNs(@PathVariable Long poId) {
        try {
            List<GRNDTO> grns = grnService.getPurchaseOrderGRNs(poId);
            return ResponseEntity.ok(grns);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

