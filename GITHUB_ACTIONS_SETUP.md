# GitHub Actions CI/CD Setup Guide

## 📋 What is GitHub Actions?

GitHub Actions automatically:
- ✅ Runs tests when you push code
- ✅ Builds Docker images
- ✅ Deploys to your Azure VM
- ✅ Runs health checks

No manual deployment needed! Just `git push` and it's live.

---

## 1️⃣ Prepare Your SSH Key

### Generate SSH Key (if you don't have one):

#### On Windows (PowerShell):
```powershell
# Generate key pair
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa"

# Display private key content (copy it)
Get-Content "$env:USERPROFILE\.ssh\id_rsa"
```

#### On Mac/Linux:
```bash
# Generate key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa

# Display private key content (copy it)
cat ~/.ssh/id_rsa
```

### Add Public Key to Azure VM:

```bash
# SSH into your Azure VM
ssh -i ~/.ssh/id_rsa azureuser@203.119.xxx.xxx

# Add your public key to authorized_keys
cat >> ~/.ssh/authorized_keys << 'EOF'
your-public-key-content-here
EOF

# Test login works
exit
ssh -i ~/.ssh/id_rsa azureuser@203.119.xxx.xxx  # Should work
```

---

## 2️⃣ Add GitHub Secrets

### Go to GitHub Repository Settings

1. Open your GitHub repository: `https://github.com/YOUR_USERNAME/team02`
2. Click **Settings** (top right)
3. Go to **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Add 3 Secrets

#### Secret 1: `AZURE_VM_IP`
```
Name: AZURE_VM_IP
Value: 203.119.xxx.xxx  (your Azure VM public IP)
```
Click **Add secret**

#### Secret 2: `AZURE_VM_USER`
```
Name: AZURE_VM_USER
Value: azureuser  (or your SSH username)
```
Click **Add secret**

#### Secret 3: `AZURE_VM_SSH_KEY`
```
Name: AZURE_VM_SSH_KEY
Value: (paste your entire private SSH key)
```

⚠️ **Important**: Make sure to paste the ENTIRE private key including:
```
-----BEGIN RSA PRIVATE KEY-----
[entire key content]
-----END RSA PRIVATE KEY-----
```

Click **Add secret**

### Screenshot Guide:

```
GitHub Settings → Secrets and variables → Actions

┌─────────────────────────────────┐
│ Name          │ Value            │
├─────────────────────────────────┤
│ AZURE_VM_IP   │ 203.119.xxx.xxx  │
│ AZURE_VM_USER │ azureuser        │
│ AZURE_VM_SSH_KEY │ -----BEGIN... │
└─────────────────────────────────┘
```

---

## 3️⃣ How GitHub Actions Works

### Workflows Included

We created 2 workflows in `.github/workflows/`:

#### **deploy.yml** (Deployment)
Triggers on: `git push` to `main` or `develop` branch

Steps:
1. ✅ Checkout code
2. ✅ Run tests and linting
3. ✅ Build Next.js application
4. ✅ Build Docker images (Dockerfile.api, Dockerfile.web)
5. ✅ Push images to GitHub Container Registry
6. ✅ Deploy to Azure VM via SSH
7. ✅ Run health checks

#### **tests.yml** (Testing)
Triggers on: Pull Requests and pushes

Steps:
1. ✅ Checkout code
2. ✅ Setup Node.js & dependencies
3. ✅ Generate Prisma Client
4. ✅ Run database migrations (test DB)
5. ✅ Run lint checks
6. ✅ Run unit tests

---

## 4️⃣ Using GitHub Actions

### Automatic Deployment

#### Development: Make changes → Test locally → Commit → Push
```bash
# Make changes
nano src/components/Button.tsx

# Test locally
npm run dev

# Commit and push
git add .
git commit -m "feat: update Button component"
git push origin feature-button

# Create Pull Request on GitHub
# → Tests run automatically
# → View results in PR
```

#### Production: Push to main → Auto-deploy
```bash
# After PR is approved and merged to main
git push origin main

# GitHub Actions will:
# 1. Run all tests
# 2. Build Docker images
# 3. Deploy to Azure VM
# 4. Run health checks

# Watch the deployment:
# Go to GitHub → Actions → Workflows → See live progress
```

### Monitor Deployment

1. Go to your GitHub repo
2. Click **Actions** tab (top menu)
3. See workflow runs with status:
   - 🟢 **Success** - Deployed!
   - 🟠 **In Progress** - Deploying...
   - 🔴 **Failed** - Check error logs

### View Workflow Logs

1. Click on the workflow run
2. Click **Logs** → See build output
3. If failed, check error messages and fix code
4. Push fix → Workflow re-runs

---

## 5️⃣ Manual Deployment (If Needed)

If you need to deploy without pushing code:

```bash
# SSH into Azure VM
ssh -i ~/.ssh/id_rsa azureuser@203.119.xxx.xxx

# Go to project directory
cd /opt/alumni-connect

# Pull latest code
git pull origin main

# Pull latest Docker images
docker-compose pull

# Restart services
docker-compose up -d --force-recreate

# Run migrations if needed
docker-compose exec api npx prisma migrate deploy

# Check status
docker-compose ps
```

---

## 6️⃣ Workflow Customization

### Edit Workflows

Workflows are in `.github/workflows/`

#### To change when deployment runs:

**File**: `.github/workflows/deploy.yml`

```yaml
on:
  push:
    branches:
      - main           # Change to: develop, staging, etc.
      - develop
```

#### To add more checks before deploy:

Add steps in `deploy.yml`:

```yaml
- name: Run custom tests
  run: npm run test:e2e
```

#### To disable auto-deploy to Azure:

Comment out the `deploy` job in `.github/workflows/deploy.yml`:

```yaml
# deploy:
#   needs: build
#   runs-on: ubuntu-latest
#   ...
```

---

## 7️⃣ Troubleshooting

### Workflow Failed?

1. Go to **Actions** tab
2. Click the failed workflow
3. Click **Logs** to see error
4. Common issues:

#### ❌ "SSH key authentication failed"
```
Check:
- AZURE_VM_SSH_KEY contains entire private key
- Permissions: chmod 600 ~/.ssh/id_rsa
- Public key added to Azure VM ~/.ssh/authorized_keys
```

#### ❌ "Failed to build Docker image"
```
Check:
- .dockerignore exists and is correct
- Dockerfile.api and Dockerfile.web exist
- npm dependencies are correct (package.json)
```

#### ❌ "Database migration failed"
```
Check:
- DATABASE_URL in .env is correct
- Prisma schema (prisma/schema.prisma) is valid
- Migration files exist in prisma/migrations/
```

#### ❌ "Health check failed"
```
Check:
- API service is responding: docker logs api
- Frontend is serving: docker logs web
- Database is healthy: docker logs db
```

### View Detailed Logs

```bash
# SSH into Azure VM
ssh azureuser@203.119.xxx.xxx

# View application logs
cd /opt/alumni-connect
docker-compose logs -f

# View specific service
docker-compose logs api
```

---

## 8️⃣ Best Practices

### ✅ DO:
- Push to `develop` branch for testing
- Use PRs before merging to `main`
- Check workflow results before assuming success
- Write meaningful commit messages
- Keep `.env` secrets out of git (use `.env.example`)

### ❌ DON'T:
- Commit `.env` file with real secrets
- Push directly to `main` without testing
- Hardcode secrets in code
- Merge failing PRs
- Change workflow files without testing locally

---

## 9️⃣ Typical Workflow

```
1. Feature Development
   ├─ Create feature branch
   ├─ Make changes locally
   ├─ Test with: npm run dev
   ├─ Commit: git commit -m "..."
   └─ Push: git push origin feature-xyz

2. Pull Request
   ├─ Go to GitHub
   ├─ Create PR
   ├─ Tests run automatically
   ├─ Review code
   └─ Approve & merge

3. Auto Deployment
   ├─ Push to main triggers workflow
   ├─ Tests run
   ├─ Docker images build
   ├─ Images deployed to Azure VM
   ├─ Migrations run
   └─ Health checks pass
   
4. Live!
   ├─ Changes live on www.sut-alumniconnect.me
   ├─ Check logs if issues: docker-compose logs -f
   └─ Rollback if needed: git revert + git push
```

---

## 🔟 Monitoring CI/CD

### GitHub Actions Dashboard

**URL**: `https://github.com/YOUR_USERNAME/team02/actions`

Shows:
- ✅ All workflow runs
- ⏱️ Execution time
- 📊 Success/failure rates
- 📝 Workflow logs

### Set Up Notifications

1. Click **⭐ Star** on workflow card
2. GitHub sends notifications on:
   - Workflow success
   - Workflow failure
   - Check your email or GitHub notifications

---

## 🔑 Security Checklist

- [ ] AZURE_VM_SSH_KEY added (entire private key)
- [ ] .env never committed to git
- [ ] .env.example created as template
- [ ] SSH key has restricted permissions
- [ ] Azure VM has firewall rules set
- [ ] Database backups scheduled
- [ ] Team members added to repo with correct permissions
- [ ] Review workflow before using in production

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker in GitHub Actions](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
- [SSH Deploy Action](https://github.com/appleboy/ssh-action)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🆘 Need Help?

### Check these files first:
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Docker setup
- [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Azure VM setup
- [QUICKSTART.md](./QUICKSTART.md) - Quick commands reference

### Common Commands for Troubleshooting:
```bash
# Check workflow status
gh workflow list

# View latest workflow run
gh run list

# View workflow run details
gh run view <run-id>

# Rerun a workflow
gh run rerun <run-id>
```

Install GitHub CLI: https://cli.github.com
