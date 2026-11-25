package com.kaizenpulse.backend.service;

import com.kaizenpulse.backend.config.MessagingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetrySimulatorService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final Random random = new Random();
    private final String[] stations = {"WELD-01", "PAINT-03", "TORQUE-02", "ASSEMBLY-04"};

    @Scheduled(fixedRate = 8500) // Her 5 saniyede bir veri üretir
    public void produceSensorData() {
        String station = stations[random.nextInt(stations.length)];
        String vin = "NMTBZ3BE00R" + (100000 + random.nextInt(899999));
        int temp = 60 + random.nextInt(65); //60-125 derece arası rastgele sıcaklık (100 üstü anormal)

        String payload = station + "|" + vin + "|" + temp;
        kafkaTemplate.send(MessagingConfig.KAFKA_TOPIC, station, payload);
        log.info("[KAFKA PRODUCER] Gönderildi. -> İstasyon: {}, VIN: {}, Sıcaklık: {}°C", station, vin,temp);
    }


}
