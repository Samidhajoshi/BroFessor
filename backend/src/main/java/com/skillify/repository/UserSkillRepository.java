package com.skillify.repository;

import com.skillify.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    List<UserSkill> findByUserId(Long userId);
    void deleteByUserIdAndId(Long userId, Long skillId);
}
