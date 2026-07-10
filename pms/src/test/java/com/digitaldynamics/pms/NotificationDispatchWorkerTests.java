package com.digitaldynamics.pms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;

import com.digitaldynamics.pms.integration.NotificationGateway;
import com.digitaldynamics.pms.model.Notification;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.NotificationRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.scheduler.NotificationDispatchWorker;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.task.scheduling.enabled=false")
class NotificationDispatchWorkerTests {

    @Autowired
    NotificationDispatchWorker notificationDispatchWorker;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    UserRepository userRepository;

    @MockBean
    NotificationGateway notificationGateway;

    @Test
    void failedDeliveryRemainsQueuedAndSuccessfulRetryMarksAsProcessed() {
        User admin = userRepository.findByEmail("admin@digitaldynamics.co.za").orElseThrow();

        Notification notification = new Notification();
        notification.setRecipientId(admin.getId());
        notification.setType("TEST_RETRY_NOTIFICATION");
        notification.setMessage("Retry me until delivered");
        notification.setReadStatus(false);
        Notification saved = notificationRepository.save(notification);

        doThrow(new RuntimeException("SMTP down")).when(notificationGateway)
                .send(anyString(), anyString(), anyString());

        notificationDispatchWorker.processOutboundNotifications();

        Notification afterFailure = notificationRepository.findById(saved.getId()).orElseThrow();
        assertThat(afterFailure.isReadStatus()).isFalse();

        doNothing().when(notificationGateway).send(anyString(), anyString(), anyString());

        notificationDispatchWorker.processOutboundNotifications();

        Notification afterSuccess = notificationRepository.findById(saved.getId()).orElseThrow();
        assertThat(afterSuccess.isReadStatus()).isTrue();
    }
}
