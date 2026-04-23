package com.openex.auth.repository;

import com.openex.auth.dto.CreatePaymentMethodRequest;
import com.openex.auth.dto.PaymentMethodResponse;
import com.openex.auth.dto.WalletTransactionResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class WalletRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public WalletRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensurePaymentMethodTable() {
        String sql = """
                create table if not exists public.payment_methods (
                    id uuid primary key default gen_random_uuid(),
                    user_id uuid not null references public.users(id) on delete cascade,
                    card_last4 varchar(4) not null,
                    expiry varchar(7) not null,
                    cardholder_name text not null,
                    street text not null,
                    city text not null,
                    postal_code text not null,
                    created_at timestamptz not null default now()
                )
                """;
        jdbcTemplate.getJdbcTemplate().execute(sql);
    }

    public Map<String, Double> getBalances(UUID userId) {
        String sql = """
                select asset_code, available
                from public.wallet_balances
                where user_id = :userId
                """;

        Map<String, Double> balances = new HashMap<>();
        balances.put("BTC", 0.0);
        balances.put("USD", 0.0);

        jdbcTemplate.query(sql, new MapSqlParameterSource("userId", userId), rs -> {
            String asset = rs.getString("asset_code");
            double amount = rs.getDouble("available");
            balances.put(asset, amount);
        });

        return balances;
    }

    public List<WalletTransactionResponse> getTransactions(UUID userId, int limit) {
        String sql = """
                select
                    id,
                    asset_code,
                    amount,
                    entry_type::text as entry_type,
                    reference_type,
                    created_at
                from public.ledger_entries
                where user_id = :userId
                order by created_at desc
                limit :limit
                """;

        RowMapper<WalletTransactionResponse> rowMapper = (rs, n) -> {
            String entryType = rs.getString("entry_type");
            String normalizedType = normalizeTransactionType(entryType);
            String description = buildDescription(entryType, rs.getString("reference_type"));

            Timestamp createdAt = rs.getTimestamp("created_at");
            long timestamp = createdAt == null ? Instant.now().toEpochMilli() : createdAt.toInstant().toEpochMilli();

            return new WalletTransactionResponse(
                    String.valueOf(rs.getLong("id")),
                    normalizedType,
                    rs.getString("asset_code"),
                    rs.getBigDecimal("amount").doubleValue(),
                    timestamp,
                    description
            );
        };

        return jdbcTemplate.query(
                sql,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("limit", Math.max(1, limit)),
                rowMapper
        );
    }

        public List<PaymentMethodResponse> getPaymentMethods(UUID userId) {
        String sql = """
            select id, card_last4, expiry, cardholder_name, street, city, postal_code, created_at
            from public.payment_methods
            where user_id = :userId
            order by created_at desc
            """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource("userId", userId), (rs, n) -> {
            Timestamp createdAt = rs.getTimestamp("created_at");
            long createdAtMillis = createdAt == null ? Instant.now().toEpochMilli() : createdAt.toInstant().toEpochMilli();
            return new PaymentMethodResponse(
                UUID.fromString(rs.getString("id")),
                rs.getString("card_last4"),
                rs.getString("expiry"),
                rs.getString("cardholder_name"),
                rs.getString("street"),
                rs.getString("city"),
                rs.getString("postal_code"),
                createdAtMillis
            );
        });
        }

        public PaymentMethodResponse addPaymentMethod(UUID userId, CreatePaymentMethodRequest request) {
        String sql = """
            insert into public.payment_methods (user_id, card_last4, expiry, cardholder_name, street, city, postal_code)
            values (:userId, :cardLast4, :expiry, :cardholderName, :street, :city, :postalCode)
            returning id, card_last4, expiry, cardholder_name, street, city, postal_code, created_at
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("userId", userId)
            .addValue("cardLast4", request.cardLast4())
            .addValue("expiry", request.expiry())
            .addValue("cardholderName", request.cardholderName())
            .addValue("street", request.street())
            .addValue("city", request.city())
            .addValue("postalCode", request.postalCode());

        return jdbcTemplate.queryForObject(sql, params, (rs, n) -> {
            Timestamp createdAt = rs.getTimestamp("created_at");
            long createdAtMillis = createdAt == null ? Instant.now().toEpochMilli() : createdAt.toInstant().toEpochMilli();
            return new PaymentMethodResponse(
                UUID.fromString(rs.getString("id")),
                rs.getString("card_last4"),
                rs.getString("expiry"),
                rs.getString("cardholder_name"),
                rs.getString("street"),
                rs.getString("city"),
                rs.getString("postal_code"),
                createdAtMillis
            );
        });
        }

        public boolean paymentMethodExists(UUID userId, UUID paymentMethodId) {
        String sql = """
            select count(1)
            from public.payment_methods
            where user_id = :userId and id = :paymentMethodId
            """;

        Integer count = jdbcTemplate.queryForObject(sql,
            new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("paymentMethodId", paymentMethodId),
            Integer.class);

        return count != null && count > 0;
        }

    @Transactional
        public Map<String, Double> applyFaucetDeposit(UUID userId, BigDecimal usdAmount, BigDecimal amountZar, UUID paymentMethodId) {
        ensureAssetRow(userId, "USD", usdAmount);

        Map<String, Double> balances = getBalances(userId);

        insertLedgerEntry(userId, "USD", usdAmount, balances.getOrDefault("USD", 0.0), "DEPOSIT", "CARD_DEPOSIT", amountZar, paymentMethodId);

        return balances;
    }

    @Transactional
    public Map<String, Double> applyWithdrawal(UUID userId, BigDecimal usdAmount, String accountNumber, String bankName) {
        String debitSql = """
                update public.wallet_balances
                set available = available - :amount,
                    updated_at = now()
                where user_id = :userId
                  and asset_code = 'USD'
                  and available >= :amount
                """;

        int updated = jdbcTemplate.update(debitSql, new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("amount", usdAmount));

        if (updated == 0) {
            return null;
        }

        Map<String, Double> balances = getBalances(userId);
        insertWithdrawalLedgerEntry(userId, usdAmount, balances.getOrDefault("USD", 0.0), accountNumber, bankName);
        return balances;
    }

    @Transactional
        public Map<String, Double> applyInternalTransfer(UUID userId,
                                 String fromAsset,
                                 String toAsset,
                                 BigDecimal fromAmount,
                                 BigDecimal toAmount,
                                 BigDecimal btcPrice) {
        String debitSql = """
                update public.wallet_balances
            set available = available - :fromAmount,
                    updated_at = now()
                where user_id = :userId
              and asset_code = :fromAsset
              and available >= :fromAmount
                """;

        int updated = jdbcTemplate.update(debitSql, new MapSqlParameterSource()
                .addValue("userId", userId)
            .addValue("fromAsset", fromAsset)
            .addValue("fromAmount", fromAmount));

        if (updated == 0) {
            return null;
        }

        ensureAssetRow(userId, toAsset, toAmount);
        Map<String, Double> balances = getBalances(userId);
        insertInternalTransferLedgerEntries(userId,
            fromAsset,
            toAsset,
            fromAmount,
            toAmount,
                btcPrice,
            balances.getOrDefault(fromAsset, 0.0),
            balances.getOrDefault(toAsset, 0.0));
        return balances;
    }

    @Transactional
    public Map<String, Double> applyOrderPnlSettlement(UUID userId,
                                                        String orderId,
                                                        BigDecimal pnlUsd,
                                                        BigDecimal btcPrice) {
        BigDecimal btcDelta = pnlUsd.divide(btcPrice, 8, java.math.RoundingMode.HALF_UP);

        if (btcDelta.compareTo(BigDecimal.ZERO) > 0) {
            ensureAssetRow(userId, "BTC", btcDelta);
        } else if (btcDelta.compareTo(BigDecimal.ZERO) < 0) {
            BigDecimal debitAmount = btcDelta.abs();
            String debitSql = """
                    update public.wallet_balances
                    set available = available - :amount,
                        updated_at = now()
                    where user_id = :userId
                      and asset_code = 'BTC'
                      and available >= :amount
                    """;

            int updated = jdbcTemplate.update(debitSql, new MapSqlParameterSource()
                    .addValue("userId", userId)
                    .addValue("amount", debitAmount));

            if (updated == 0) {
                return null;
            }
        }

        Map<String, Double> balances = getBalances(userId);
        if (btcDelta.compareTo(BigDecimal.ZERO) != 0) {
            insertOrderPnlSettlementLedgerEntry(userId, orderId, pnlUsd, btcPrice, btcDelta, balances.getOrDefault("BTC", 0.0));
        }
        return balances;
    }

    private void ensureAssetRow(UUID userId, String assetCode, BigDecimal amountToAdd) {
        String sql = """
                insert into public.wallet_balances (user_id, asset_code, available, locked)
                values (:userId, :assetCode, :amountToAdd, 0)
                on conflict (user_id, asset_code)
                do update set
                    available = public.wallet_balances.available + excluded.available,
                    updated_at = now()
                """;

        jdbcTemplate.update(sql, new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("assetCode", assetCode)
                .addValue("amountToAdd", amountToAdd));
    }

    private void insertLedgerEntry(UUID userId,
                                   String assetCode,
                                   BigDecimal amount,
                                   Double balanceAfter,
                                   String entryType,
                                   String referenceType,
                                   BigDecimal amountZar,
                                   UUID paymentMethodId) {
        String sql = """
                insert into public.ledger_entries
                    (event_id, user_id, asset_code, entry_type, amount, balance_after, reference_type, metadata)
                values
                    (:eventId, :userId, :assetCode, cast(:entryType as ledger_entry_type), :amount, :balanceAfter, :referenceType,
                     jsonb_build_object('amount_zar', :amountZar, 'payment_method_id', :paymentMethodId))
                """;

        jdbcTemplate.update(sql, new MapSqlParameterSource()
                .addValue("eventId", UUID.randomUUID())
                .addValue("userId", userId)
                .addValue("assetCode", assetCode)
                .addValue("entryType", entryType)
                .addValue("amount", amount)
                .addValue("balanceAfter", BigDecimal.valueOf(balanceAfter))
                .addValue("referenceType", referenceType)
                .addValue("amountZar", amountZar)
                .addValue("paymentMethodId", paymentMethodId.toString()));
    }

    private void insertWithdrawalLedgerEntry(UUID userId,
                                             BigDecimal amountUsd,
                                             Double balanceAfter,
                                             String accountNumber,
                                             String bankName) {
        String sql = """
                insert into public.ledger_entries
                    (event_id, user_id, asset_code, entry_type, amount, balance_after, reference_type, metadata)
                values
                    (:eventId, :userId, :assetCode, cast(:entryType as ledger_entry_type), :amount, :balanceAfter, :referenceType,
                     jsonb_build_object('account_number', :accountNumber, 'bank_name', :bankName))
                """;

        jdbcTemplate.update(sql, new MapSqlParameterSource()
                .addValue("eventId", UUID.randomUUID())
                .addValue("userId", userId)
                .addValue("assetCode", "USD")
                .addValue("entryType", "WITHDRAWAL")
                .addValue("amount", amountUsd)
                .addValue("balanceAfter", BigDecimal.valueOf(balanceAfter))
                .addValue("referenceType", "BANK_WITHDRAWAL")
                .addValue("accountNumber", accountNumber)
                .addValue("bankName", bankName));
    }

    private void insertOrderPnlSettlementLedgerEntry(UUID userId,
                                                     String orderId,
                                                     BigDecimal pnlUsd,
                                                     BigDecimal btcPrice,
                                                     BigDecimal btcDelta,
                                                     Double btcBalanceAfter) {
        String sql = """
                insert into public.ledger_entries
                    (event_id, user_id, asset_code, entry_type, amount, balance_after, reference_type, metadata)
                values
                    (:eventId, :userId, :assetCode, cast(:entryType as ledger_entry_type), :amount, :balanceAfter, :referenceType,
                     jsonb_build_object('order_id', :orderId, 'pnl_usd', :pnlUsd, 'btc_price', :btcPrice, 'btc_delta', :btcDelta))
                """;

        String entryType = btcDelta.compareTo(BigDecimal.ZERO) >= 0 ? "DEPOSIT" : "WITHDRAWAL";
        BigDecimal amount = btcDelta.abs();

        jdbcTemplate.update(sql, new MapSqlParameterSource()
                .addValue("eventId", UUID.randomUUID())
                .addValue("userId", userId)
                .addValue("assetCode", "BTC")
                .addValue("entryType", entryType)
                .addValue("amount", amount)
                .addValue("balanceAfter", BigDecimal.valueOf(btcBalanceAfter))
                .addValue("referenceType", "ORDER_PNL_SETTLEMENT")
                .addValue("orderId", orderId)
                .addValue("pnlUsd", pnlUsd)
                .addValue("btcPrice", btcPrice)
                .addValue("btcDelta", btcDelta));
    }

            private void insertInternalTransferLedgerEntries(UUID userId,
                                     String fromAsset,
                                     String toAsset,
                                     BigDecimal fromAmount,
                                     BigDecimal toAmount,
                                     BigDecimal btcPrice,
                                     Double fromBalanceAfter,
                                     Double toBalanceAfter) {
            String sql = """
                insert into public.ledger_entries
                    (event_id, user_id, asset_code, entry_type, amount, balance_after, reference_type, metadata)
                values
                    (:eventId, :userId, :assetCode, cast(:entryType as ledger_entry_type), :amount, :balanceAfter, :referenceType, :metadata::jsonb)
                """;

            UUID transferGroupId = UUID.randomUUID();
            UUID transferOutEventId = UUID.randomUUID();
            UUID transferInEventId = UUID.randomUUID();
            String transferOutMetadataJson = String.format("{\"transfer_id\": \"%s\", \"direction\": \"out\", \"from_asset\": \"%s\", \"to_asset\": \"%s\", \"from_amount\": %s, \"to_amount\": %s, \"btc_price\": %s}",
                transferGroupId,
                fromAsset,
                toAsset,
                fromAmount.toPlainString(),
                toAmount.toPlainString(),
                btcPrice.toPlainString());
            String transferInMetadataJson = String.format("{\"transfer_id\": \"%s\", \"direction\": \"in\", \"from_asset\": \"%s\", \"to_asset\": \"%s\", \"from_amount\": %s, \"to_amount\": %s, \"btc_price\": %s}",
                transferGroupId,
                fromAsset,
                toAsset,
                fromAmount.toPlainString(),
                toAmount.toPlainString(),
                btcPrice.toPlainString());

            jdbcTemplate.update(sql, new MapSqlParameterSource()
                .addValue("eventId", transferOutEventId)
                .addValue("userId", userId)
                .addValue("assetCode", fromAsset)
                .addValue("entryType", "WITHDRAWAL")
                .addValue("amount", fromAmount)
                .addValue("balanceAfter", BigDecimal.valueOf(fromBalanceAfter))
                .addValue("referenceType", "INTERNAL_TRANSFER_OUT")
                .addValue("metadata", transferOutMetadataJson));

            jdbcTemplate.update(sql, new MapSqlParameterSource()
                .addValue("eventId", transferInEventId)
                .addValue("userId", userId)
                .addValue("assetCode", toAsset)
                .addValue("entryType", "DEPOSIT")
                .addValue("amount", toAmount)
                .addValue("balanceAfter", BigDecimal.valueOf(toBalanceAfter))
                .addValue("referenceType", "INTERNAL_TRANSFER_IN")
                .addValue("metadata", transferInMetadataJson));
            }

    private String normalizeTransactionType(String entryType) {
        if (entryType == null) return "trade";
        if (entryType.equalsIgnoreCase("DEPOSIT")) return "deposit";
        if (entryType.equalsIgnoreCase("WITHDRAWAL")) return "withdrawal";
        return "trade";
    }

    private String buildDescription(String entryType, String referenceType) {
        if (entryType == null) {
            return "Ledger entry";
        }
        if (entryType.equalsIgnoreCase("DEPOSIT") && "CARD_DEPOSIT".equalsIgnoreCase(referenceType)) {
            return "Card deposit";
        }
        if (entryType.equalsIgnoreCase("DEPOSIT") && "FAUCET".equalsIgnoreCase(referenceType)) {
            return "Faucet deposit";
        }
        if (entryType.equalsIgnoreCase("DEPOSIT") && "INTERNAL_TRANSFER_IN".equalsIgnoreCase(referenceType)) {
            return "Internal transfer in";
        }
        if ("ORDER_PNL_SETTLEMENT".equalsIgnoreCase(referenceType)) {
            return "Order PnL settlement";
        }
        if (entryType.equalsIgnoreCase("DEPOSIT")) {
            return "Wallet deposit";
        }
        if (entryType.equalsIgnoreCase("WITHDRAWAL")) {
            if ("INTERNAL_TRANSFER_OUT".equalsIgnoreCase(referenceType)) {
                return "Internal transfer out";
            }
            if ("BANK_WITHDRAWAL".equalsIgnoreCase(referenceType)) {
                return "Bank withdrawal";
            }
            return "Wallet withdrawal";
        }
        return "Trade settlement";
    }
}
