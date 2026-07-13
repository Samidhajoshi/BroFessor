package com.skillify.ai.repository;

import com.skillify.ai.entity.ProfileAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProfileAnalysisRepository extends JpaRepository<ProfileAnalysis, Long> {

    Optional<ProfileAnalysis> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    List<ProfileAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);
}
