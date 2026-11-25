package com.kaizenpulse.backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.internals.Topic;
import org.apache.kafka.shaded.org.apache.commons.net.util.NetConstants;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class MessagingConfig {

    public static final String KAFKA_TOPIC = "factory-telemetry";
    public static final String RABBIT_QUEUE = "andon-work-orders";

    @Bean
    public NewTopic telemetryTopic(){
        return TopicBuilder.name(KAFKA_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public Queue workOrderQueue(){
        return new Queue(RABBIT_QUEUE, true);
    }

}
