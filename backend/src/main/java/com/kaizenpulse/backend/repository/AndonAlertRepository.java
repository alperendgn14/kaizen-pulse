package com.kaizenpulse.backend.repository;
import com.kaizenpulse.backend.entity.AndonAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AndonAlertRepository extends JpaRepository<AndonAlert, Long>{
    List <AndonAlert> findByStatusOrderByCreatedAtDesc(String status);
    List <AndonAlert> findAllByOrderByCreatedAtDesc();
}