package com.openex.auth.dto;

public record AuthResponse(
        String token,
        AuthUserResponse user
) {
}
