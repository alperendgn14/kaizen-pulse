package com.kaizenpulse.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name="andon_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AndonAlert{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String stationCode; //Örn: WELD-01, PAINT-03, TORQUE-02

    @Column(nullable=false)
    private String vehicleVin; // şasi no

    @Column(nullable = false)
    private String severity; //warning, critical

    @Column(nullable = false)
    private String status; // OPEN, IN_PROGRESS

    @Column(length=500)
    private String description;

    @Column(length=1000)
    private String aiRecommendation; // ai kök neden öneri

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate(){
        this.createdAt = LocalDateTime.now();
        if(this.status==null){
            this.status = "OPEN";
        }
    }
}