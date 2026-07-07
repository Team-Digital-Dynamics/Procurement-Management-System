package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.integration.NotificationGateway;
import com.digitaldynamics.pms.model.Notification;
import com.digitaldynamics.pms.repository.NotificationRepository;
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

    public void dispatchAlert(Long recipientId, String recipientEmail, String type, String message) {
        dispatchAlert(recipientId, recipientEmail, type, message, true);
    }

    public void dispatchAlert(Long recipientId, String recipientEmail, String type, String message, boolean persistRecord) {
        if (persistRecord) {
            Notification notification = new Notification();
            notification.setRecipientId(recipientId);
            notification.setType(type);
            notification.setMessage(message);
            notification.setReadStatus(false);
            notificationRepository.save(notification);
        }

        try {
            notificationGateway.send(recipientEmail, type, message);
        } catch (Exception ex) {
            LOG.warn("Email dispatch failed for recipientId={} recipientEmail={} type={}. Alert persisted in DB.",
                    recipientId, recipientEmail, type, ex);
        }
    }
}
