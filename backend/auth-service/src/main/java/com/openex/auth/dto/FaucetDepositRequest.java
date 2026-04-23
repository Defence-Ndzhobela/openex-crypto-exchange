package com.openex.auth.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record FaucetDepositRequest(
        @NotNull @DecimalMin(value = "100.00", message = "Minimum deposit is 100 ZAR") BigDecimal amountZar,
        @NotNull UUID paymentMethodId
) {
}
