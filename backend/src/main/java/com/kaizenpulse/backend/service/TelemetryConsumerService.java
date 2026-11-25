package com.kaizenpulse.backend.service;

import com.kaizenpulse.backend.config.MessagingConfig;
import com.kaizenpulse.backend.entity.AndonAlert;
import com.kaizenpulse.backend.repository.AndonAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryConsumerService {

    private final AndonAlertRepository repository;
    private final RabbitTemplate rabbitTemplate;
    private final GroqAiService groqAiService;

    @KafkaListener(topics = MessagingConfig.KAFKA_TOPIC, groupId = "kaizen-telemetry-group")
    public void consumeTelemetry(String message) {
        String[] parts = message.split("\\|");
        String station = parts[0];
        String vin = parts[1];
        int sensorValue = Integer.parseInt(parts[2]);

        if (sensorValue >= 100) {
            String severity = sensorValue >= 115 ? "CRITICAL" : "WARNING";
            GroqAiService.DynamicAnomaly dynamic = groqAiService.generateDynamicAnomaly(station, vin, severity);

            AndonAlert alert = AndonAlert.builder()
                    .stationCode(station)
                    .vehicleVin(vin)
                    .severity(severity)
                    .status("OPEN")
                    .description(dynamic.description())
                    .aiRecommendation(dynamic.aiRecommendation())
                    .build();

            AndonAlert saved = repository.save(alert);

            String workOrder = "İş Emri #" + saved.getId() + " | İstasyon: " + station + " | Öncelik: " + severity;
            rabbitTemplate.convertAndSend(MessagingConfig.RABBIT_QUEUE, workOrder);
            log.warn("[ANDON + GROQ] RabbitMQ'ya Kaydedildi -> {} | Arıza: {} | AI: {}",
                    workOrder, dynamic.description(), dynamic.aiRecommendation());
        }
    }
}