# OpenEx Backend Setup (Supabase PostgreSQL)

This backend is configured to use PostgreSQL hosted on Supabase.

## 1) Configure environment variables

Copy the example file and add your real password.

```powershell
Copy-Item .env.example .env
```

Required values:

- `DB_HOST=aws-1-eu-central-1.pooler.supabase.com`
- `DB_PORT=5432`
- `DB_NAME=postgres`
- `DB_USER=postgres.onzbfmwknjuskmwyqtgn`
- `DB_PASSWORD=<your-password>`

Important:

- Supabase PostgreSQL requires SSL.
- Use JDBC URL with `sslmode=require`.
- For IPv4 networks, use Session Pooler instead of direct DB host.

## 2) Spring Boot datasource values

Use these in your service `application.yml` or load from environment:

```yaml
spring:
	datasource:
		url: jdbc:postgresql://aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
		username: postgres.onzbfmwknjuskmwyqtgn
		password: ${DB_PASSWORD}
		driver-class-name: org.postgresql.Driver
```

Shared template file is provided at:

- `infrastructure/spring/application.yml`

## 3) Maven dependency

Ensure each Spring Boot service includes PostgreSQL driver:

```xml
<dependency>
	<groupId>org.postgresql</groupId>
	<artifactId>postgresql</artifactId>
	<scope>runtime</scope>
</dependency>
```

## 4) Test connectivity (optional)

If Docker is available:

```powershell
docker run --rm -e PGPASSWORD="<your-password>" postgres:16 psql "host=db.onzbfmwknjuskmwyqtgn.supabase.co port=5432 dbname=postgres user=postgres sslmode=require" -c "select now();"

# Session pooler variant (recommended on IPv4 networks)
docker run --rm -e PGPASSWORD="<your-password>" postgres:16 psql "host=aws-1-eu-central-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.onzbfmwknjuskmwyqtgn sslmode=require" -c "select now();"
```

## 5) Security notes

- `.env` is gitignored in this folder.
- Do not commit real credentials.

## 6) Run auth service (Spring Boot)

From backend root:

```powershell
mvn -f auth-service/pom.xml spring-boot:run
```

Auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/health`

Example register payload:

```json
{
	"name": "OpenEx Demo",
	"email": "demo@openex.io",
	"password": "OpenEx123!"
}
```
