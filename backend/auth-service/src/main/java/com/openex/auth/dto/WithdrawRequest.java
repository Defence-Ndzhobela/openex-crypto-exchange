package com.openex.auth.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record WithdrawRequest(
        @NotNull @DecimalMin(value = "0.01", message = "Withdrawal amount must be greater than 0") BigDecimal amount,
        @NotBlank @Pattern(regexp = "\\d{6,20}", message = "Account number must be 6 to 20 digits") String accountNumber,
        @NotBlank @Size(max = 120) String bankName
) {
}
