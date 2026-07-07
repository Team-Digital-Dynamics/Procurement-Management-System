package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReadStatusFalseOrderByCreatedAtAsc();

    List<Notification> findByRecipientIdAndReadStatusFalseOrderByCreatedAtDesc(Long recipientId);

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
}
