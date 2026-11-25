package com.kaizenpulse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AndonCreateRequest(
        @NotBlank(message = "İstasyon kodu boş olamaz.")
        String stationCode,

        @NotBlank(message = "Araç VIN numarası boş olamaz.")
        String vehicleVin,

        @NotBlank(message="Aciliyet seviyesi boş olamaz.")
        @Pattern(regexp = "WARNING|CRITICAL", message="Seviye sadece WARNING veya CRITICAL olabilir.")
        String severity,

        @NotBlank(message="Arıza açıklaması boş olamaz.")
        String description
){}
