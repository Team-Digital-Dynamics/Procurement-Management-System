package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ApiResponseDTO;
import com.digitaldynamics.pms.dto.ReportDTO;
import com.digitaldynamics.pms.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Report Controller
 * Provides report generation and export functionality
 */
@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * Generate requisition report
     * GET /api/reports/requisitions
     */
    @GetMapping("/requisitions")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<ReportDTO>> generateRequisitionReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "PDF") String format) {
        
        log.info("Generating requisition report from {} to {} in format {}", fromDate, toDate, format);
        
        ReportDTO report = reportService.generateRequisitionReport(fromDate, toDate, format);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<ReportDTO>builder()
                        .success(true)
                        .message("Requisition report generated successfully")
                        .data(report)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Generate RFQ report
     * GET /api/reports/rfqs
     */
    @GetMapping("/rfqs")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<ReportDTO>> generateRFQReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "PDF") String format) {
        
        log.info("Generating RFQ report from {} to {} in format {}", fromDate, toDate, format);
        
        ReportDTO report = reportService.generateRFQReport(fromDate, toDate, format);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<ReportDTO>builder()
                        .success(true)
                        .message("RFQ report generated successfully")
                        .data(report)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Generate purchase order report
     * GET /api/reports/purchase-orders
     */
    @GetMapping("/purchase-orders")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<ReportDTO>> generatePurchaseOrderReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "PDF") String format) {
        
        log.info("Generating purchase order report from {} to {} in format {}", fromDate, toDate, format);
        
        ReportDTO report = reportService.generatePurchaseOrderReport(fromDate, toDate, format);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<ReportDTO>builder()
                        .success(true)
                        .message("Purchase order report generated successfully")
                        .data(report)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }


    /**
     * Generate supplier performance report
     * GET /api/reports/suppliers
     */
    @GetMapping("/suppliers")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<ReportDTO>> generateSupplierReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "PDF") String format) {
        
        log.info("Generating supplier report from {} to {} in format {}", fromDate, toDate, format);
        
        ReportDTO report = reportService.generateSupplierReport(fromDate, toDate, format);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<ReportDTO>builder()
                        .success(true)
                        .message("Supplier report generated successfully")
                        .data(report)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Generate spending analysis report
     * GET /api/reports/spending
     */
    @GetMapping("/spending")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<ReportDTO>> generateSpendingReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "PDF") String format) {
        
        log.info("Generating spending report from {} to {} in format {}", fromDate, toDate, format);
        
        ReportDTO report = reportService.generateSpendingReport(fromDate, toDate, format);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<ReportDTO>builder()
                        .success(true)
                        .message("Spending report generated successfully")
                        .data(report)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Export report to file
     * GET /api/reports/{reportId}/export
     */
    @GetMapping("/{reportId}/export")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<String>> exportReport(
            @PathVariable Long reportId,
            @RequestParam(defaultValue = "PDF") String format) {
        
        log.info("Exporting report {} to format {}", reportId, format);
        
        String fileUrl = reportService.exportReport(reportId, format);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<String>builder()
                        .success(true)
                        .message("Report exported successfully")
                        .data(fileUrl)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Get user's reports
     * GET /api/reports/my-reports
     */
    @GetMapping("/my-reports")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<List<ReportDTO>>> getUserReports(
            @RequestParam Long userId) {
        
        log.info("Fetching reports for user: {}", userId);
        
        List<ReportDTO> reports = reportService.getUserReports(userId);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<List<ReportDTO>>builder()
                        .success(true)
                        .message("Reports retrieved successfully")
                        .data(reports)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Delete report
     * DELETE /api/reports/{reportId}
     */
    @DeleteMapping("/{reportId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER', 'FINANCE', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<String>> deleteReport(@PathVariable Long reportId) {
        log.info("Deleting report: {}", reportId);
        
        reportService.deleteReport(reportId);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<String>builder()
                        .success(true)
                        .message("Report deleted successfully")
                        .data("Report " + reportId + " deleted")
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }
}

