#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./create-azure-vm.sh <resource-group> <vm-name> <location> <admin-username> <ssh-public-key-file> <image-repo>
# Example:
# ./create-azure-vm.sh team02-rg team02-vm southeastasia azureuser ~/.ssh/team02-key.pub your-docker-username/next-app:latest

RG=${1:-team02-rg}
VM=${2:-team02-vm}
LOCATION=${3:-southeastasia}
ADMIN=${4:-azureuser}
SSH_KEY_FILE=${5:-~/.ssh/id_rsa.pub}
IMAGE_REPO=${6:-your-docker-username/next-app:latest}

if ! command -v az >/dev/null 2>&1; then
  echo "az CLI not found. Install Azure CLI and login: https://learn.microsoft.com/cli/azure/install-azure-cli"
  exit 1
fi

echo "Creating resource group: $RG in $LOCATION"
az group create -n "$RG" -l "$LOCATION"

# Read public key
if [ ! -f "$SSH_KEY_FILE" ]; then
  echo "SSH public key not found: $SSH_KEY_FILE"
  exit 1
fi
SSH_PUB_KEY=$(cat "$SSH_KEY_FILE")

echo "Creating VM: $VM"
az vm create \
  --resource-group "$RG" \
  --name "$VM" \
  --image UbuntuLTS \
  --size Standard_B1s \
  --admin-username "$ADMIN" \
  --ssh-key-values "$SSH_PUB_KEY" \
  --custom-data ./cloud-init.yml \
  --output json

# Open port 80 and 443 and 22
az vm open-port --resource-group "$RG" --name "$VM" --port 80
az vm open-port --resource-group "$RG" --name "$VM" --port 443
az vm open-port --resource-group "$RG" --name "$VM" --port 22

# Set IMAGE_REPO tag as VM tag for reference
az vm update --resource-group "$RG" --name "$VM" --set tags.IMAGE_REPO="$IMAGE_REPO"

echo "VM $VM created. Run 'az vm show -d -g $RG -n $VM --query publicIps -o tsv' to get public IP."