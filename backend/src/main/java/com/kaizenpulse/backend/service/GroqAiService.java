package com.kaizenpulse.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GroqAiService {

    private final RestClient restClient;
    private final String apiKey;
    private final String apiUrl;
    private final String model;
    public record DynamicAnomaly(String description, String aiRecommendation) {}

    public GroqAiService(
            @Value("${groq.api.key}") String apiKey,
            @Value("${groq.api.url}") String apiUrl,
            @Value("${groq.api.model}") String model) {
        this.restClient = RestClient.create();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
    }

    public DynamicAnomaly generateDynamicAnomaly(String station, String vin, String severity){
        String prompt = String.format(
                "Sen Toyota Sakarya fabrikasında çalışan kıdemli bir Toyota Production System mühendisisin. " +
                        "%s istasyonunda %s şasi numaralı araç üretilirken %s seviyesinde rastgele, gerçekçi ve teknik bir endüstriyel arıza senaryosu üret " +
                        "(sadece sıcaklık değil; tork sapması, kaynak akımı, boya basıncı, sensör hizalama, pnömatik valf, konveyör titreşimi v.b çeşitlendir.) " +
                        "Ardından teknisyen için 1-2 cümlelik net bir kök neden ve acil müdahale önerisi yaz.\n" +
                        "Yanıtı SADECE şu tek satırlık formatta ver, başka hiçbir şey ekleme:\n" +
                        "ARIZA_ACIKLAMASI || AI_MUDAHALE_ONERISI",
                station,vin,severity
        );

        Map<String,Object> requestBody = Map.of(
                "model", model,
                "temperature", 0.85,
                "max_tokens", 2048,
                "messages", List.of(
                        Map.of("role", "system", "content", "Sadece 'ARIZA ||| ONERI' formatında, Türkçe ve teknik fabrika arıza senaryoları üret."),
                        Map.of("role", "user", "content", prompt)
                )
        );

        try{
            GroqResponse response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(GroqResponse.class);

            if(response != null && response.choices() != null && !response.choices().isEmpty()){
                String content = response.choices().get(0).message().content().trim();
                String[] parts = content.split("\\|\\|\\|");
                if(parts.length >= 2){
                    return new DynamicAnomaly(parts[0].trim(), parts[1].trim());
                }
                return new DynamicAnomaly(content, "AI Analizi: " + station + " istasyonunda anomali tespit edildi, bakım ekibi yönlendirildi.");
            }
        } catch (Exception e) {
            log.error("Dinamik arıza üretimi başarısız: {}", e.getMessage());
        }

        return new DynamicAnomaly(
                station + " istasyonunda beklenmeyen sensör sapması tespit edildi",
                "Yedek AI Analizi: İstasyon parametrelerini kontrol edip sensörü kalibre ediniz."
        );


    }



    public String analyzeAnomaly(String station, String vin, String description) {
        String prompt = String.format(
                "Sen Toyota Sakarya fabrikasında çalışan kıdemli bir TPS (Toyota Production System) ve kestirimci bakım mühendisisin. " +
                        "İstasyon: %s | Araç VIN: %s | Arıza: %s. " +
                        "Teknisyen için Türkçe, en fazla 2 kısa cümlelik net bir kök neden tahmini ve acil müdahale aksiyonu yaz. Başlık veya madde işareti kullanma.",
                station, vin, description
        );

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "temperature", 0.3,
                "max_tokens", 2048,
                "messages", List.of(
                        Map.of("role", "system", "content", "Kısa, teknik ve doğrudan uygulanabilir endüstriyel bakım önerileri ver."),
                        Map.of("role", "user", "content", prompt)
                )
        );

        try {
            GroqResponse response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(GroqResponse.class);

            if (response != null && response.choices() != null && !response.choices().isEmpty()) {
                return response.choices().get(0).message().content().trim();
            }
        } catch (Exception e) {
            log.error("Groq API çağrısı başarısız oldu: {}", e.getMessage());
        }

        return "Yedek AI Analizi: " + station + " istasyonunda anomali tespit edildi, bakım ekibi acil kontrol için yönlendirildi.";
    }

    public String generateFiveWhyReport(String station, String vin, String severity, String description, String aiAdvice) {
        String prompt = String.format(
                "Sen Toyota Sakarya fabrikasında çalışan kıdemli bir TPS (Toyota Production System) ve Kaizen mühendisisin. " +
                        "Aşağıdaki Andon arızası için detaylı, kurumsal ve Türkçe bir 5-Why (5 Neden) Kaizen Raporu hazırla.\n" +
                        "İstasyon: %s | Araç VIN: %s | Seviye: %s | Arıza: %s | İlk AI Tespiti: %s\n\n" +
                        "Raporu tam olarak şu başlıklarla, net ve teknik bir dille yaz (Markdown yıldız ** kullanma):\n" +
                        "1. Problem Tanımı:\n" +
                        "2. 5 Neden Analizi:\n" +
                        "- Neden 1:\n- Neden 2:\n- Neden 3:\n- Neden 4:\n- Neden 5 (Kök Neden):\n" +
                        "3. Acil Müdahale:\n" +
                        "4. Kalıcı Kaizen & Poka-Yoke Önlemi:\n" +
                        "5. Sorumlu Ekip ve Kontrol Periyodu:",
                station, vin, severity, description, aiAdvice != null ? aiAdvice : "Belirtilmedi"
        );

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "temperature", 0.3,
                "max_tokens", 2048,
                "messages", List.of(
                        Map.of("role", "system", "content", "Toyota Üretim Sistemi (TPS) standartlarında, resmi ve detaylı 5-Why Kaizen raporları hazırla."),
                        Map.of("role", "user", "content", prompt)
                )
        );

        try {
            GroqResponse response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(GroqResponse.class);

            if (response != null && response.choices() != null && !response.choices().isEmpty()) {
                return response.choices().get(0).message().content().trim();
            }
        } catch (Exception e) {
            log.error("5-Why rapor üretimi başarısız: {}", e.getMessage());
        }

        return "Rapor üretilirken yapay zeka servisine ulaşılamadı. Lütfen tekrar deneyin.";
    }



    // Spring Boot 4.2 / Jackson 3 ile tam uyumlu Java Record DTO'ları
    public record GroqResponse(List<Choice> choices) {}
    public record Choice(Message message) {}
    public record Message(String role, String content) {}
}