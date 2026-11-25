package com.kaizenpulse.backend.service;

import com.kaizenpulse.backend.config.MessagingConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class WorkOrderConsumerService {

    @RabbitListener(queues = MessagingConfig.RABBIT_QUEUE)
    public void receiveWorkOrder(String workOrder){
        log.info("[RABBITMQ Consumer] Bakım ekibine iş emri ulaştı -> {}", workOrder);
    }
}
