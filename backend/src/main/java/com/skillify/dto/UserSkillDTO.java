package com.skillify.dto;

import com.skillify.entity.UserSkill;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSkillDTO {
    private Long id;
    private String skillName;
    private String type;

    public static UserSkillDTO from(UserSkill s) {
        return UserSkillDTO.builder()
                .id(s.getId())
                .skillName(s.getSkillName())
                .type(s.getType().name())
                .build();
    }
}
