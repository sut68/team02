# Quick Start Guide - Docker Deployment

## 📋 Checklist ก่อน Deploy

- [ ] Docker & Docker Compose installed
- [ ] `.env` file updated with production values
- [ ] Domain pointing to server IP (sut-alumniconnect.me)
- [ ] Port 80, 443, 5432 open in firewall

## 🚀 Quick Start (Local Testing)

```bash
# 1. Update environment variables
nano .env

# 2. Build and start services
docker-compose up -d --build

# 3. Check if services are running
docker-compose ps

# 4. View logs
docker-compose logs -f

# 5. Run database migrations (first time only)
docker-compose exec api npx prisma migrate deploy
```

## ✅ Verify Deployment

```bash
# Check all services are healthy
docker-compose ps

# Test API is reachable
docker-compose exec web curl http://api:8000/health

# Check database connection
docker-compose exec db psql -U postgres -d mydb -c "SELECT version();"
```

## 🔧 Troubleshooting

### Services not starting
```bash
# Check logs for errors
docker-compose logs -f

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### API not responding
```bash
# Check API logs
docker-compose logs api

# Verify API container is running
docker-compose exec api ps aux
```

### Database connection failed
```bash
# Check database is healthy
docker-compose exec db pg_isready -U postgres

# Verify DATABASE_URL in .env matches docker-compose
cat .env | grep DATABASE_URL
```

## 📚 Useful Commands

| Command | Purpose |
|---------|---------|
| `docker-compose ps` | List all services |
| `docker-compose logs -f [service]` | View logs in real-time |
| `docker-compose restart [service]` | Restart a service |
| `docker-compose exec [service] sh` | SSH into container |
| `docker-compose down -v` | Stop and remove all (including volumes) |
| `docker-compose up -d --build` | Build and start all services |

## 🌐 Access Points

- **Frontend**: https://www.sut-alumniconnect.me
- **API**: https://api.sut-alumniconnect.me
- **Database**: localhost:5432 (internal only)

## 📖 Full Documentation

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for complete guide.

## 💡 Pro Tips

1. **Always backup database before updates**: `docker-compose exec db pg_dump -U postgres mydb > backup.sql`
2. **Monitor resource usage**: `docker stats`
3. **Keep Docker images updated**: `docker-compose pull && docker-compose up -d`
4. **Use `.env.example` as template**: Never commit `.env` with secrets!
