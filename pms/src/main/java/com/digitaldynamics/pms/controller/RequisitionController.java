package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ApiResponse;
import com.digitaldynamics.pms.dto.RequisitionCreateDTO;
import com.digitaldynamics.pms.dto.RequisitionDTO;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.RequisitionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/requisitions")
public class RequisitionController {
    private final RequisitionService requisitionService;

    public RequisitionController(RequisitionService requisitionService) {
        this.requisitionService = requisitionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('REQUESTER','PROCUREMENT_OFFICER')")
    public ResponseEntity<ApiResponse<RequisitionDTO>> createRequisition(
            @Valid @RequestBody RequisitionCreateDTO payload,
            @AuthenticationPrincipal CurrentUser currentUser) {
        RequisitionDTO created = requisitionService.createRequisition(payload, currentUser.id(), currentUser.email());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Requisition created"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('REQUESTER','PROCUREMENT_OFFICER','ADMIN')")
    public ResponseEntity<ApiResponse<RequisitionDTO>> getById(@PathVariable Long id) {
        RequisitionDTO requisition = requisitionService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(requisition, "Requisition retrieved"));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasAnyRole('REQUESTER','PROCUREMENT_OFFICER','ADMIN')")
    public ResponseEntity<ApiResponse<List<RequisitionDTO>>> myRequests(
            @AuthenticationPrincipal CurrentUser currentUser) {
        List<RequisitionDTO> requests = requisitionService.myRequestsChronological(currentUser.id());
        return ResponseEntity.ok(ApiResponse.success(requests, "Requisition history retrieved"));
    }
}
