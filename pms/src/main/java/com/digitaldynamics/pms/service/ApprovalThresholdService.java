package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.ApprovalThresholdDtos.ApprovalThresholdRequest;
import com.digitaldynamics.pms.dto.ApprovalThresholdDtos.ApprovalThresholdResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.ApprovalThreshold;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.ApprovalThresholdRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApprovalThresholdService {
    private final ApprovalThresholdRepository approvalThresholdRepository;

    public ApprovalThresholdService(ApprovalThresholdRepository approvalThresholdRepository) {
        this.approvalThresholdRepository = approvalThresholdRepository;
    }

    @Transactional(readOnly = true)
    public List<ApprovalThresholdResponse> all() {
        return approvalThresholdRepository.findAllByOrderByLevelAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ApprovalThresholdResponse create(ApprovalThresholdRequest request) {
        validateRequest(request);

        if (approvalThresholdRepository.existsByLevel(request.level())) {
            throw new ApiException(HttpStatus.CONFLICT, "An approval threshold already exists for this level");
        }

        ApprovalThreshold threshold = new ApprovalThreshold();
        applyRequest(threshold, request);

        approvalThresholdRepository.save(threshold);

        return toResponse(threshold);
    }

    @Transactional
    public ApprovalThresholdResponse update(Long id, ApprovalThresholdRequest request) {
        validateRequest(request);

        ApprovalThreshold threshold = approvalThresholdRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval threshold not found"));

        approvalThresholdRepository.findByLevel(request.level())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Another approval threshold already exists for this level");
                });

        applyRequest(threshold, request);

        return toResponse(threshold);
    }

    @Transactional
    public void delete(Long id) {
        if (!approvalThresholdRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Approval threshold not found");
        }

        approvalThresholdRepository.deleteById(id);
    }

    @Transactional
    public List<ApprovalThresholdResponse> resetDefaults() {
        approvalThresholdRepository.deleteAll();

        approvalThresholdRepository.save(defaultThreshold(
                1,
                UserRole.APPROVER_LEVEL_1,
                BigDecimal.ZERO,
                BigDecimal.valueOf(25000),
                "Level 1 approval for low-value requisitions."));

        approvalThresholdRepository.save(defaultThreshold(
                2,
                UserRole.APPROVER_LEVEL_2,
                BigDecimal.valueOf(25000.01),
                BigDecimal.valueOf(100000),
                "Level 2 approval for medium-value requisitions."));

        approvalThresholdRepository.save(defaultThreshold(
                3,
                UserRole.APPROVER_LEVEL_3,
                BigDecimal.valueOf(100000.01),
                null,
                "Level 3 approval for high-value requisitions."));

        return all();
    }

    private void applyRequest(ApprovalThreshold threshold, ApprovalThresholdRequest request) {
        threshold.setLevel(request.level());
        threshold.setRole(request.role());
        threshold.setMinAmount(request.minAmount());
        threshold.setMaxAmount(request.maxAmount());
        threshold.setDescription(request.description());
    }

    private void validateRequest(ApprovalThresholdRequest request) {
        if (request.maxAmount() != null && request.maxAmount().compareTo(request.minAmount()) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Maximum amount cannot be lower than minimum amount");
        }

        if (request.level() == 1 && request.role() != UserRole.APPROVER_LEVEL_1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Level 1 must use Approver Level 1 role");
        }

        if (request.level() == 2 && request.role() != UserRole.APPROVER_LEVEL_2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Level 2 must use Approver Level 2 role");
        }

        if (request.level() == 3 && request.role() != UserRole.APPROVER_LEVEL_3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Level 3 must use Approver Level 3 role");
        }
    }

    private ApprovalThreshold defaultThreshold(
            int level,
            UserRole role,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String description) {

        ApprovalThreshold threshold = new ApprovalThreshold();
        threshold.setLevel(level);
        threshold.setRole(role);
        threshold.setMinAmount(minAmount);
        threshold.setMaxAmount(maxAmount);
        threshold.setDescription(description);

        return threshold;
    }

    private ApprovalThresholdResponse toResponse(ApprovalThreshold threshold) {
        return new ApprovalThresholdResponse(
                threshold.getId(),
                threshold.getLevel(),
                threshold.getRole(),
                threshold.getMinAmount(),
                threshold.getMaxAmount(),
                threshold.getDescription(),
                threshold.getCreatedAt(),
                threshold.getUpdatedAt());
    }
}