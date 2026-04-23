package com.openex.auth.repository;

import com.openex.auth.dto.OrderResponse;
import com.openex.auth.dto.PlaceOrderRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public class OrderRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public OrderRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureOrdersTable() {
        String sql = """
                create table if not exists public.openex_orders (
                    id uuid primary key,
                    user_id uuid not null references public.users(id) on delete cascade,
                    side varchar(10) not null,
                    type varchar(10) not null,
                    status varchar(20) not null,
                    price numeric(20,8) not null,
                    quantity numeric(20,8) not null,
                    remaining numeric(20,8) not null,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now()
                )
                """;
        jdbcTemplate.getJdbcTemplate().execute(sql);
    }

    public OrderResponse placeOrder(UUID userId, PlaceOrderRequest request) {
        UUID orderId = UUID.randomUUID();
        String orderType = request.type().toLowerCase();
        BigDecimal quantity = request.quantity();
        BigDecimal price = request.price();

        String status = "open";
        BigDecimal remaining = quantity;

        String sql = """
                insert into public.openex_orders (id, user_id, side, type, status, price, quantity, remaining)
                values (:id, :userId, :side, :type, :status, :price, :quantity, :remaining)
                returning id, side, type, status, price, quantity, remaining, created_at
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", orderId)
                .addValue("userId", userId)
                .addValue("side", request.side().toLowerCase())
                .addValue("type", orderType)
                .addValue("status", status)
                .addValue("price", price)
                .addValue("quantity", quantity)
                .addValue("remaining", remaining);

        return jdbcTemplate.queryForObject(sql, params, (rs, n) -> {
            Timestamp createdAt = rs.getTimestamp("created_at");
            long timestamp = createdAt == null ? Instant.now().toEpochMilli() : createdAt.toInstant().toEpochMilli();

            return new OrderResponse(
                    rs.getString("id"),
                    rs.getBigDecimal("price").doubleValue(),
                    rs.getBigDecimal("quantity").doubleValue(),
                    rs.getBigDecimal("remaining").doubleValue(),
                    rs.getString("side"),
                    rs.getString("type"),
                    rs.getString("status"),
                    timestamp
            );
        });
    }

    public List<OrderResponse> getOrders(UUID userId) {
        String sql = """
                select id, side, type, status, price, quantity, remaining, created_at
                from public.openex_orders
                where user_id = :userId
                order by created_at desc
                """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource("userId", userId), (rs, n) -> {
            Timestamp createdAt = rs.getTimestamp("created_at");
            long timestamp = createdAt == null ? Instant.now().toEpochMilli() : createdAt.toInstant().toEpochMilli();

            return new OrderResponse(
                    rs.getString("id"),
                    rs.getBigDecimal("price").doubleValue(),
                    rs.getBigDecimal("quantity").doubleValue(),
                    rs.getBigDecimal("remaining").doubleValue(),
                    rs.getString("side"),
                    rs.getString("type"),
                    rs.getString("status"),
                    timestamp
            );
        });
    }

    public OrderResponse cancelOrder(UUID userId, UUID orderId) {
        String sql = """
                update public.openex_orders
                set status = 'cancelled',
                    updated_at = now()
                where id = :orderId
                  and user_id = :userId
                  and status = 'open'
                returning id, side, type, status, price, quantity, remaining, created_at
                """;

        return jdbcTemplate.query(sql,
                new MapSqlParameterSource()
                        .addValue("orderId", orderId)
                        .addValue("userId", userId),
                rs -> {
                    if (!rs.next()) {
                        return null;
                    }

                    Timestamp createdAt = rs.getTimestamp("created_at");
                    long timestamp = createdAt == null ? Instant.now().toEpochMilli() : createdAt.toInstant().toEpochMilli();

                    return new OrderResponse(
                            rs.getString("id"),
                            rs.getBigDecimal("price").doubleValue(),
                            rs.getBigDecimal("quantity").doubleValue(),
                            rs.getBigDecimal("remaining").doubleValue(),
                            rs.getString("side"),
                            rs.getString("type"),
                            rs.getString("status"),
                            timestamp
                    );
                });
    }
}
