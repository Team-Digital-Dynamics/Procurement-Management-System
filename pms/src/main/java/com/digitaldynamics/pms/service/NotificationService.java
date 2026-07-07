package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.model.Notification;
import com.digitaldynamics.pms.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private static final Logger LOG = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final JavaMailSender javaMailSender;

    public NotificationService(NotificationRepository notificationRepository, JavaMailSender javaMailSender) {
        this.notificationRepository = notificationRepository;
        this.javaMailSender = javaMailSender;
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
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(recipientEmail);
            email.setSubject(type);
            email.setText(message);
            javaMailSender.send(email);
        } catch (Exception ex) {
            LOG.warn("Email dispatch failed for recipientId={} recipientEmail={} type={}. Alert persisted in DB.",
                    recipientId, recipientEmail, type, ex);
        }
    }
}
