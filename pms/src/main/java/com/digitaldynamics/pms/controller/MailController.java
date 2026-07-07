package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.AuthDtos.MessageResponse;
import com.digitaldynamics.pms.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mail")
public class MailController {
    private final EmailService emailService;
    private final String defaultTestRecipient;

    public MailController(EmailService emailService,
            @Value("${pms.mail.test-recipient:admindigitaldynamics@gmail.com}") String defaultTestRecipient) {
        this.emailService = emailService;
        this.defaultTestRecipient = defaultTestRecipient;
    }

    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse testMail(@RequestParam(required = false) String recipient) {
        String target = recipient == null || recipient.isBlank() ? defaultTestRecipient : recipient;
        emailService.sendSystemTestEmail(target);
        return new MessageResponse("Email sent to " + target);
    }
}
