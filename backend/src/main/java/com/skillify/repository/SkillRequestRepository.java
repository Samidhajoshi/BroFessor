package com.skillify.repository;

import com.skillify.entity.SkillRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillRequestRepository extends JpaRepository<SkillRequest, Long> {

    List<SkillRequest> findByReceiverIdOrderByIdDesc(Long receiverId);

    List<SkillRequest> findBySenderIdOrderByIdDesc(Long senderId);
}
