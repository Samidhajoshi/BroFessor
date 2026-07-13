package com.skillify.dto;

import com.skillify.entity.SkillRequest;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SkillRequestDTO {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private String skillWanted;
    private String skillOffered;
    private String comment;
    private String status;
    private boolean oneWay;

    public static SkillRequestDTO from(SkillRequest r) {
        return SkillRequestDTO.builder()
                .id(r.getId())
                .senderId(r.getSender().getId())
                .senderName(r.getSender().getName())
                .receiverId(r.getReceiver().getId())
                .receiverName(r.getReceiver().getName())
                .skillWanted(r.getSkillWanted())
                .skillOffered(r.getSkillOffered())
                .comment(r.getComment())
                .status(r.getStatus().name())
                .oneWay(r.isOneWay())
                .build();
    }
}
