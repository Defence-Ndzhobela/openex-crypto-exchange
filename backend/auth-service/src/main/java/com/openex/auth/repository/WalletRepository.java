package com.openex.auth.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
public class WalletRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public WalletRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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
}
