package com.openex.auth.repository;

import com.openex.auth.model.UserRecord;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public UserRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<UserRecord> findByEmail(String email) {
        String sql = """
                select id, email::text as email, display_name, password_hash
                from public.users
                where email = :email
                """;

        try {
            UserRecord row = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("email", email),
                    (rs, n) -> new UserRecord(
                            UUID.fromString(rs.getString("id")),
                            rs.getString("email"),
                            rs.getString("display_name"),
                            rs.getString("password_hash")
                    )
            );
            return Optional.ofNullable(row);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    public UserRecord create(String email, String displayName, String passwordHash) {
        String sql = """
                insert into public.users (email, password_hash, display_name, is_admin)
                values (:email, :passwordHash, :displayName, false)
                returning id, email::text as email, display_name, password_hash
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("email", email)
                .addValue("passwordHash", passwordHash)
                .addValue("displayName", displayName);

        return jdbcTemplate.queryForObject(sql, params, (rs, n) -> new UserRecord(
                UUID.fromString(rs.getString("id")),
                rs.getString("email"),
                rs.getString("display_name"),
                rs.getString("password_hash")
        ));
    }

    public void ensureWalletRows(UUID userId) {
        String sql = """
                insert into public.wallet_balances (user_id, asset_code, available, locked)
                values (:userId, 'BTC', 0, 0),
                       (:userId, 'USD', 0, 0)
                on conflict (user_id, asset_code) do nothing
                """;

        jdbcTemplate.update(sql, new MapSqlParameterSource("userId", userId));
    }
}
