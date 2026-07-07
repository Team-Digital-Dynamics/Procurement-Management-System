package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ApiResponseDTO;
import com.digitaldynamics.pms.dto.ChatbotRequestDTO;
import com.digitaldynamics.pms.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Chatbot Controller
 * Provides AI-powered procurement assistant interface
 */
@Slf4j
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    /**
     * Ask chatbot a question
     * POST /api/chatbot/ask
     */
    @PostMapping("/ask")
    @PreAuthorize("hasAnyRole('REQUESTOR', 'PROCUREMENT_OFFICER', 'APPROVER', 'FINANCE', 'SUPPLIER', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<String>> askChatbot(@RequestBody ChatbotRequestDTO request) {
        log.info("Chatbot query from user: {}", request.getUserId());
        
        String response = chatbotService.askChatbot(request);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<String>builder()
                        .success(true)
                        .message("Chatbot response received")
                        .data(response)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Get suggested actions for query
     * GET /api/chatbot/suggestions
     */
    @GetMapping("/suggestions")
    @PreAuthorize("hasAnyRole('REQUESTOR', 'PROCUREMENT_OFFICER', 'APPROVER', 'FINANCE', 'SUPPLIER', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<Object>> getSuggestedActions(
            @RequestParam String query) {
        
        log.info("Getting suggested actions for query: {}", query);
        
        Object actions = chatbotService.getSuggestedActions(query);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<Object>builder()
                        .success(true)
                        .message("Suggested actions retrieved")
                        .data(actions)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Get chat history for user
     * GET /api/chatbot/history
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('REQUESTOR', 'PROCUREMENT_OFFICER', 'APPROVER', 'FINANCE', 'SUPPLIER', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<Object>> getChatHistory(
            @RequestParam Long userId) {
        
        log.info("Fetching chat history for user: {}", userId);
        
        Object history = chatbotService.getChatHistory(userId);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<Object>builder()
                        .success(true)
                        .message("Chat history retrieved")
                        .data(history)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    /**
     * Submit feedback on chatbot response
     * POST /api/chatbot/feedback
     */
    @PostMapping("/feedback")
    @PreAuthorize("hasAnyRole('REQUESTOR', 'PROCUREMENT_OFFICER', 'APPROVER', 'FINANCE', 'SUPPLIER', 'AUDITOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponseDTO<String>> submitFeedback(
            @RequestParam Long messageId,
            @RequestParam String rating) {
        
        log.info("Submitting feedback for message: {} with rating: {}", messageId, rating);
        
        chatbotService.submitFeedback(messageId, rating);
        
        return ResponseEntity.ok(
                ApiResponseDTO.<String>builder()
                        .success(true)
                        .message("Feedback submitted successfully")
                        .data("Thank you for your feedback")
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }
}

