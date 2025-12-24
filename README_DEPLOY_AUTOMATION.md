Deployment automation files and usage

Files created:
- scripts/push-image.sh        - Bash script to tag & push image to Docker Hub
- scripts/push-image.bat      - Windows batch equivalent
- azure/cloud-init.yml        - cloud-init passed to VM for provisioning (installs Docker/Compose, pulls image and runs it)
- azure/create-azure-vm.sh    - az CLI script to create resource group & VM and open ports
- docker-compose.prod.yml    - compose file for running on VM (port 80 -> 3000)

Quick usage (Linux/macOS):

1) Build image locally (from repo root):

```bash
# Build with docker-compose
docker-compose build

# Or build image directly
docker build -t next-app:latest .
```

2) Tag & push to Docker Hub

```bash
# Login if not already
docker login

# Push (replace myuser and repo)
./scripts/push-image.sh myuser next-app:latest myuser/next-app latest
```

3) Create Azure VM (requires az CLI & logged in)

```bash
# Edit ./azure/cloud-init.yml to set IMAGE_REPO if desired or pass tag via environment before upload
# Ensure you have SSH pub key file, e.g. ~/.ssh/id_rsa.pub
chmod +x ./azure/create-azure-vm.sh
./azure/create-azure-vm.sh team02-rg team02-vm southeastasia azureuser ~/.ssh/id_rsa.pub myuser/next-app:latest

# After creation, get VM IP
az vm show -d -g team02-rg -n team02-vm --query publicIps -o tsv
```

4) Verify deployment

```bash
# On VM (or run locally curl):
curl http://<VM_PUBLIC_IP>
```

Notes
- Creating the VM requires Azure subscription and `az login`.
- The `cloud-init.yml` will attempt to pull `${IMAGE_REPO}`; you may edit it to hardcode your image repository.
- If Docker Hub repo is private, login inside VM before `docker-compose pull` or include `docker login` in cloud-init with secrets (not recommended).
