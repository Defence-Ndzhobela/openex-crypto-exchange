package com.openex.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreatePaymentMethodRequest(
        @NotBlank @Pattern(regexp = "\\d{4}", message = "cardLast4 must be 4 digits") String cardLast4,
        @NotBlank @Size(max = 7) String expiry,
        @NotBlank @Size(max = 120) String cardholderName,
        @NotBlank @Size(max = 255) String street,
        @NotBlank @Size(max = 120) String city,
        @NotBlank @Size(max = 20) String postalCode
) {
}
