package com.kaizenpulse.backend.controller;

import com.kaizenpulse.backend.dto.AndonAlertResponse;
import com.kaizenpulse.backend.dto.AndonCreateRequest;
import com.kaizenpulse.backend.dto.KaizenReportResponse;
import com.kaizenpulse.backend.entity.AndonAlert;
import com.kaizenpulse.backend.exception.ResourceNotFoundException;
import com.kaizenpulse.backend.repository.AndonAlertRepository;
import com.kaizenpulse.backend.service.GroqAiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/andon")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AndonController {

    private final AndonAlertRepository repository;
    private final GroqAiService groqAiService;

    @GetMapping
    public ResponseEntity<List<AndonAlertResponse>> getAllAlerts() {
        List<AndonAlertResponse> responses = repository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(AndonAlertResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<AndonAlertResponse> triggerAndon(@Valid @RequestBody AndonCreateRequest request) {
        String aiAdvice = groqAiService.analyzeAnomaly(
                request.stationCode(),
                request.vehicleVin(),
                request.description()
        );

        AndonAlert alert = AndonAlert.builder()
                .stationCode(request.stationCode())
                .vehicleVin(request.vehicleVin())
                .severity(request.severity())
                .status("OPEN")
                .description(request.description())
                .aiRecommendation(aiAdvice)
                .build();

        AndonAlert saved = repository.save(alert);
        return ResponseEntity.status(HttpStatus.CREATED).body(AndonAlertResponse.fromEntity(saved));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<AndonAlertResponse> resolveAlert(@PathVariable("id") Long id) {
        AndonAlert alert = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Andon kaydı bulunamadı. ID: " + id));

        alert.setStatus("RESOLVED");
        AndonAlert updated = repository.save(alert);
        return ResponseEntity.ok(AndonAlertResponse.fromEntity(updated));
    }

    @PostMapping("/{id}/kaizen-report")
    public ResponseEntity<KaizenReportResponse> generateKaizenReport(@PathVariable("id") Long id) {
        AndonAlert alert = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rapor üretilecek Andon kaydı bulunamadı. ID: " + id));

        String report = groqAiService.generateFiveWhyReport(
                alert.getStationCode(),
                alert.getVehicleVin(),
                alert.getSeverity(),
                alert.getDescription(),
                alert.getAiRecommendation()
        );
        return ResponseEntity.ok(new KaizenReportResponse(report));
    }
}