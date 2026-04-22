package com.openex.auth.dto;

import java.util.Map;
import java.util.UUID;

public record AuthUserResponse(
        UUID id,
        String name,
        String email,
        Map<String, Double> balances
) {
}
