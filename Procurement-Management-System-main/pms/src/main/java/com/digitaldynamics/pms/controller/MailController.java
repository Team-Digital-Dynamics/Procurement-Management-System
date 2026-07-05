
package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.service.EmailService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mail")
public class MailController {

    private final EmailService emailService;

    public MailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/test")
    public String testMail() {

        emailService.sendSystemTestEmail(
                "admindigitaldynamics@gmail.com"
        );

        return "Email sent";
    }
}
