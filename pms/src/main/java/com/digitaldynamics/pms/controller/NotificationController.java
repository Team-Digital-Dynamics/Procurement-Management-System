package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.AuthDtos.MessageResponse;
import com.digitaldynamics.pms.model.Notification;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.NotificationService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/v1/notifications", "/api/notifications" })
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<NotificationResponse> notifications(@AuthenticationPrincipal CurrentUser user) {
        return notificationService.notificationsForRecipient(user.id())
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public MessageResponse setReadStatus(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable Long id,
            @RequestBody SetReadStatusRequest request) {
        boolean updated = notificationService.setReadStatus(user.id(), id, request.read());
        return updated
                ? new MessageResponse("Notification updated")
                : new MessageResponse("Notification not found");
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public MessageResponse markAllRead(@AuthenticationPrincipal CurrentUser user) {
        int updatedCount = notificationService.markAllAsRead(user.id());
        return new MessageResponse("Marked " + updatedCount + " notification(s) as read");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(@AuthenticationPrincipal CurrentUser user, @PathVariable Long id) {
        notificationService.deleteNotification(user.id(), id);
    }

    @DeleteMapping("/read")
    @PreAuthorize("isAuthenticated()")
    public MessageResponse clearRead(@AuthenticationPrincipal CurrentUser user) {
        long deletedCount = notificationService.clearReadNotifications(user.id());
        return new MessageResponse("Deleted " + deletedCount + " read notification(s)");
    }

    public record SetReadStatusRequest(boolean read) {
    }

    public record NotificationResponse(Long id, String title, String message, String type, boolean read,
            LocalDateTime createdAt) {
        static NotificationResponse from(Notification notification) {
            return new NotificationResponse(
                    notification.getId(),
                    notification.getType(),
                    notification.getMessage(),
                    notification.getType(),
                    notification.isReadStatus(),
                    notification.getCreatedAt());
        }
    }
}
