package com.kaizenpulse.backend.dto;

import com.kaizenpulse.backend.entity.AndonAlert;
import org.springframework.cglib.core.Local;

import java.time.LocalDateTime;



public record AndonAlertResponse(
        Long id,
        String stationCode,
        String vehicleVin,
        String severity,
        String status,
        String description,
        String aiRecommendation,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
){
    public static AndonAlertResponse fromEntity(AndonAlert alert){
        return new AndonAlertResponse(
                alert.getId(),
                alert.getStationCode(),
                alert.getVehicleVin(),
                alert.getSeverity(),
                alert.getStatus(),
                alert.getDescription(),
                alert.getAiRecommendation(),
                alert.getCreatedAt(),
                alert.getResolvedAt()
        );
    }
}
