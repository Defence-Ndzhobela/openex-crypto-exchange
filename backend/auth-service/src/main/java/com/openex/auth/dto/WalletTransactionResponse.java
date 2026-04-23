package com.openex.auth.dto;

public record WalletTransactionResponse(
        String id,
        String type,
        String asset,
        double amount,
        long timestamp,
        String description
) {
}
