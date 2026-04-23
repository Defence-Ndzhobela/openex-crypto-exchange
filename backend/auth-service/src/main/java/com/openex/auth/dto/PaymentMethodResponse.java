package com.openex.auth.dto;

import java.util.UUID;

public record PaymentMethodResponse(
        UUID id,
        String cardLast4,
        String expiry,
        String cardholderName,
        String street,
        String city,
        String postalCode,
        long createdAt
) {
}
