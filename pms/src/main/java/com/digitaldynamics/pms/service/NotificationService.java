package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.integration.NotificationGateway;
import com.digitaldynamics.pms.model.Notification;
import com.digitaldynamics.pms.repository.NotificationRepository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private static final Logger LOG = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationGateway notificationGateway;

    public NotificationService(NotificationRepository notificationRepository, NotificationGateway notificationGateway) {
        this.notificationRepository = notificationRepository;
        this.notificationGateway = notificationGateway;
    }

    public List<Notification> notificationsForRecipient(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    @Transactional
    public boolean setReadStatus(Long recipientId, Long notificationId, boolean readStatus) {
        return notificationRepository.findByIdAndRecipientId(notificationId, recipientId)
                .map(notification -> {
                    notification.setReadStatus(readStatus);
                    notificationRepository.save(notification);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public int markAllAsRead(Long recipientId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndReadStatusFalseOrderByCreatedAtDesc(recipientId);
        for (Notification notification : unread) {
            notification.setReadStatus(true);
        }
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    @Transactional
    public boolean deleteNotification(Long recipientId, Long notificationId) {
        return notificationRepository.deleteByIdAndRecipientId(notificationId, recipientId) > 0;
    }

    @Transactional
    public long clearReadNotifications(Long recipientId) {
        return notificationRepository.deleteByRecipientIdAndReadStatusTrue(recipientId);
    }

    public void dispatchAlert(Long recipientId, String recipientEmail, String type, String message) {
        dispatchAlert(recipientId, recipientEmail, type, message, true);
    }

    public boolean dispatchAlert(Long recipientId, String recipientEmail, String type, String message, boolean persistRecord) {
        Notification savedNotification = null;

        if (persistRecord) {
            Notification notification = new Notification();
            notification.setRecipientId(recipientId);
            notification.setType(type);
            notification.setMessage(message);
            notification.setReadStatus(false);
            savedNotification = notificationRepository.save(notification);
        }

        try {
            notificationGateway.send(recipientEmail, type, message);

            // Mark as read immediately on successful delivery so the scheduler does not retry and cause duplicates
            if (savedNotification != null) {
                savedNotification.setReadStatus(true);
                notificationRepository.save(savedNotification);
            }

            return true;
        } catch (Exception ex) {
<<<<<<< Updated upstream
            LOG.error("Email dispatch failed for recipientId={} recipientEmail={} type={}. Alert persisted in DB.",
=======
            LOG.warn("Email dispatch failed for recipientId={} recipientEmail={} type={}. Alert persisted in DB for retry.",
>>>>>>> Stashed changes
                    recipientId, recipientEmail, type, ex);
            return false;
        }
    }
}
