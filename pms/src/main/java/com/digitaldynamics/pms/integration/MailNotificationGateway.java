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
        emailService.send(recipient, humanizeSubject(subject), formatEmailBody(body, subject));
    }

    private String humanizeSubject(String type) {
        return switch (type) {
            case "APPROVAL_NOTIFICATION"               -> "Digital Dynamics PMS \u2014 Requisition Decision";
            case "RFQ_NOTIFICATION", "RFQ_INVITE"     -> "Digital Dynamics PMS \u2014 RFQ Invitation";
            case "RFQ_CREATED"                        -> "Digital Dynamics PMS \u2014 New RFQ Created";
            case "PURCHASE_ORDER_NOTIFICATION"         -> "Digital Dynamics PMS \u2014 Purchase Order Generated";
            case "PURCHASE_ORDER_DISPATCH_NOTIFICATION" -> "Digital Dynamics PMS \u2014 Purchase Order Dispatched";
            case "GRN_NOTIFICATION", "GRN_ALERT"       -> "Digital Dynamics PMS \u2014 Goods Receipt Notification";
            case "APPROVAL_DECISION"                  -> "Digital Dynamics PMS \u2014 Approval Decision";
            default                                   -> "Digital Dynamics PMS \u2014 System Notification";
        };
    }

    private String formatEmailBody(String message, String type) {
        String intro = switch (type) {
            case "APPROVAL_NOTIFICATION", "APPROVAL_DECISION" ->
                "We are writing to inform you of a decision made on a purchase requisition assigned to your account.";
            case "RFQ_NOTIFICATION", "RFQ_INVITE" ->
                "You have been selected as a potential supplier and are invited to participate in a competitive quotation process on the Digital Dynamics Procurement Management System.";
            case "RFQ_CREATED" ->
                "A new Request for Quotation has been created and is now open for supplier submissions.";
            case "PURCHASE_ORDER_NOTIFICATION" ->
                "A purchase order has been generated on the Digital Dynamics Procurement Management System and is linked to your supplier profile.";
            case "PURCHASE_ORDER_DISPATCH_NOTIFICATION" ->
                "A purchase order has been formally dispatched and requires your attention. Please review the order details and prepare for fulfilment.";
            case "GRN_NOTIFICATION", "GRN_ALERT" ->
                "This is to inform you of an update regarding a recent goods delivery recorded on the Digital Dynamics Procurement Management System.";
            default ->
                "This is an automated notification from the Digital Dynamics Procurement Management System.";
        };

        return "Dear Valued Recipient,\n\n"
                + intro + "\n\n"
                + "Notification Details:\n"
                + message + "\n\n"
                + "Please log in to the Digital Dynamics PMS portal to view the full details "
                + "and take any required action.\n\n"
                + "If you believe you have received this notification in error or require "
                + "assistance, please contact your System Administrator.\n\n"
                + "Kind Regards,\n"
                + "Digital Dynamics PMS Team\n"
                + "Procurement Management System\n"
                + "Digital Dynamics (Pty) Ltd";
    }
}
