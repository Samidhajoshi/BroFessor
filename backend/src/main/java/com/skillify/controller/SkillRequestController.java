package com.skillify.controller;

import com.skillify.dto.AcceptRequestDTO;
import com.skillify.dto.SendRequestDTO;
import com.skillify.dto.SkillRequestDTO;
import com.skillify.security.SecurityUtils;
import com.skillify.service.SkillRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class SkillRequestController {

    private final SkillRequestService requestService;

    @PostMapping("/send")
    public ResponseEntity<SkillRequestDTO> send(@Valid @RequestBody SendRequestDTO req) {
        return ResponseEntity.ok(requestService.send(SecurityUtils.currentUser(), req));
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<SkillRequestDTO>> incoming() {
        return ResponseEntity.ok(requestService.getIncoming(SecurityUtils.currentUser()));
    }

    @GetMapping("/sent")
    public ResponseEntity<List<SkillRequestDTO>> sent() {
        return ResponseEntity.ok(requestService.getSent(SecurityUtils.currentUser()));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<SkillRequestDTO> accept(@PathVariable Long id,
                                                    @Valid @RequestBody AcceptRequestDTO body) {
        return ResponseEntity.ok(requestService.accept(SecurityUtils.currentUser(), id, body));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<SkillRequestDTO> reject(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.reject(SecurityUtils.currentUser(), id));
    }
}
