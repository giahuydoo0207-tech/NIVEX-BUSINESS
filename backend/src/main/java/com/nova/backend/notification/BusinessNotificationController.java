package com.nova.backend.notification;
import java.util.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/notifications") public class BusinessNotificationController { private static final UUID ORG=UUID.fromString("00000000-0000-0000-0000-000000000001"); private final NotificationRepository repo; public BusinessNotificationController(NotificationRepository repo){this.repo=repo;} @GetMapping public List<NovaNotification> list(){return repo.business(ORG);}@PostMapping("/{id}/read") public void read(@PathVariable UUID id){repo.read(id,ORG);} }
