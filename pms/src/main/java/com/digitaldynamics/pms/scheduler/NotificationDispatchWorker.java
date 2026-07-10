package com.digitaldynamics.pms.scheduler;

import com.digitaldynamics.pms.model.Notification;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.NotificationRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.service.NotificationService;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class NotificationDispatchWorker {

    private static final Logger LOG = LoggerFactory.getLogger(NotificationDispatchWorker.class);

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationDispatchWorker(NotificationRepository notificationRepository,
            NotificationService notificationService,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void processOutboundNotifications() {
        List<Notification> unreadNotifications = notificationRepository.findByReadStatusFalseOrderByCreatedAtAsc();

        for (Notification notification : unreadNotifications) {
            try {
                Long recipientId = notification.getRecipientId();
                User user = userRepository.findById(recipientId)
                        .orElseThrow(() -> new IllegalStateException("Recipient not found: " + recipientId));

                boolean delivered = notificationService.dispatchAlert(
                        recipientId,
                        user.getEmail(),
                        notification.getType(),
                        notification.getMessage(),
                        false
                );

                if (delivered) {
                    notification.setReadStatus(true);
                    notificationRepository.save(notification);
                }
            } catch (Exception ex) {
                LOG.warn("Notification delivery failed for notificationId={} recipientId={}",
                        notification.getId(), notification.getRecipientId(), ex);
            }
        }
    }
}
