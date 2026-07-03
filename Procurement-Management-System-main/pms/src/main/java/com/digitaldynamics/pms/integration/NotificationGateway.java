package com.digitaldynamics.pms.integration;

public interface NotificationGateway {
    void send(String recipient, String subject, String body);
}
