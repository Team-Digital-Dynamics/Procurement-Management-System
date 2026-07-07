package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ApiResponseDTO;
import com.digitaldynamics.pms.dto.DashboardDTO;
import com.digitaldynamics.pms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Dashboard Controller
 * Provides KPI and summary data for procurement dashboard
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Get dashboard for current user
     * GET /api/dashboard
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('REQUESTOR', 'PROCUREMENT_OFFICER', 'APPROVER', 'FINANCE', 'SUPPLIER', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<DashboardDTO>> getDashboard(Principal principal) {
        log.info("Fetching dashboard for user: {}", principal.getName());
        
        // Extract userId from JWT token (would be set by security context)
        // For now, using email as identifier
        Long userId = 1L; // This would come from SecurityContext
        
        DashboardDTO dashboard = dashboardService.getDashboard(userId);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<DashboardDTO>builder()
                        .success(true)
                        .message("Dashboard retrieved successfully")
                        .data(dashboard)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Get KPI metrics
     * GET /api/dashboard/metrics
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<DashboardDTO.DashboardMetricsDTO>> getMetrics() {
        log.info("Fetching KPI metrics");
        
        DashboardDTO.DashboardMetricsDTO metrics = dashboardService.getMetrics();
        
        return ResponseEntity.ok(
                ApiResponseDTO.<DashboardDTO.DashboardMetricsDTO>builder()
                        .success(true)
                        .message("Metrics retrieved successfully")
                        .data(metrics)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Get dashboard for specific role
     * GET /api/dashboard/role/{role}
     */
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<DashboardDTO>> getDashboardByRole(@PathVariable String role) {
        log.info("Fetching dashboard for role: {}", role);
        
        DashboardDTO dashboard = dashboardService.getDashboardByRole(role);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<DashboardDTO>builder()
                        .success(true)
                        .message("Dashboard retrieved successfully for role: " + role)
                        .data(dashboard)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Refresh dashboard cache
     * POST /api/dashboard/refresh
     */
    @PostMapping("/refresh")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<String>> refreshDashboard() {
        log.info("Refreshing dashboard cache");
        
        dashboardService.refreshDashboardCache();
        
        return ResponseEntity.ok(
                ApiResponseDTO.<String>builder()
                        .success(true)
                        .message("Dashboard cache refreshed successfully")
                        .data("Cache refreshed")
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }
}

