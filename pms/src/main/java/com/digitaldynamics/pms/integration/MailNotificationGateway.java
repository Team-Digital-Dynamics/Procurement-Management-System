package com.digitaldynamics.pms.integration;

import com.digitaldynamics.pms.service.EmailService;
import org.springframework.stereotype.Component;

@Component
public class MailNotificationGateway implements NotificationGateway {
    private final EmailService emailService;

    public MailNotificationGateway(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        emailService.send(recipient, subject, body);
    }
}
