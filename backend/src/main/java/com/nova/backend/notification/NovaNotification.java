package com.nova.backend.notification;
import java.time.Instant; import java.util.UUID;
public record NovaNotification(UUID id,String type,String title,String body,String data,Instant readAt,Instant createdAt) {}
