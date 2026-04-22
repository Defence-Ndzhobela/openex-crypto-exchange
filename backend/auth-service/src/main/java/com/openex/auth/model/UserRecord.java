package com.openex.auth.model;

import java.util.UUID;

public record UserRecord(
        UUID id,
        String email,
        String displayName,
        String passwordHash
) {
}
