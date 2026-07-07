package com.digitaldynamics.pms.security;

import com.digitaldynamics.pms.service.AuditService;
import java.util.StringJoiner;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditLoggingAspect {

    private final AuditService auditService;

    public AuditLoggingAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    @Pointcut("@annotation(com.digitaldynamics.pms.security.Auditable) || "
            + "execution(* com.digitaldynamics.pms.service.ApprovalService.processApproval(..))")
    public void auditableOperation() {
    }

    @AfterReturning("auditableOperation()")
    public void afterSuccessfulOperation(JoinPoint joinPoint) {
        String actor = resolveActor();
        String action = resolveAction(joinPoint);
        String entityType = resolveEntityType(joinPoint);
        String entityId = resolveEntityId(joinPoint);
        String details = resolveDetails(joinPoint);

        auditService.logEvent(actor, action, entityType, entityId, details);
    }

    private String resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "SYSTEM";
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CurrentUser currentUser) {
            if (currentUser.email() != null && !currentUser.email().isBlank()) {
                return currentUser.email();
            }
            return currentUser.id() == null ? "SYSTEM" : String.valueOf(currentUser.id());
        }
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String value && !"anonymousUser".equalsIgnoreCase(value)) {
            return value;
        }
        return "SYSTEM";
    }

    private String resolveAction(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        if ("processApproval".equals(signature.getName())) {
            return "PROCESS_APPROVAL";
        }
        return toUpperSnakeCase(signature.getName());
    }

    private String resolveEntityType(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        if ("processApproval".equals(signature.getName())) {
            return "Requisition";
        }
        String className = signature.getDeclaringType().getSimpleName();
        return className.endsWith("Service")
                ? className.substring(0, className.length() - "Service".length())
                : className;
    }

    private String resolveEntityId(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args.length == 0 || args[0] == null) {
            return "N/A";
        }
        return String.valueOf(args[0]);
    }

    private String resolveDetails(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Object[] args = joinPoint.getArgs();

        if ("processApproval".equals(signature.getName()) && args.length >= 4) {
            String decision = safeToString(args[2]);
            String comments = safeToString(args[3]);
            String approverId = safeToString(args[1]);
            return "ApproverId=" + approverId + "; Decision=" + decision + "; Comments=" + comments;
        }

        String[] parameterNames = signature.getParameterNames();
        StringJoiner details = new StringJoiner("; ");
        for (int i = 0; i < args.length; i++) {
            String parameterName = (parameterNames != null && i < parameterNames.length)
                    ? parameterNames[i]
                    : "arg" + i;
            details.add(parameterName + "=" + safeToString(args[i]));
        }
        return details.length() > 0 ? details.toString() : "Method executed successfully";
    }

    private static String safeToString(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        if (text.length() > 500) {
            return text.substring(0, 500) + "...";
        }
        return text;
    }

    private static String toUpperSnakeCase(String methodName) {
        StringBuilder converted = new StringBuilder();
        for (int i = 0; i < methodName.length(); i++) {
            char current = methodName.charAt(i);
            if (Character.isUpperCase(current) && i > 0) {
                converted.append('_');
            }
            converted.append(Character.toUpperCase(current));
        }
        return converted.toString();
    }
}