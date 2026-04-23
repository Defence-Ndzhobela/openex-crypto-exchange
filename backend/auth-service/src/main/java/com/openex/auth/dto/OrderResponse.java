package com.openex.auth.dto;

public record OrderResponse(
        String id,
        double price,
        double quantity,
        double remaining,
        String side,
        String type,
        String status,
        long timestamp
) {
}
