#!/bin/bash

set -e

echo "🚀 Installation complète FFmpeg Worker"
echo "======================================"
echo ""

# 0. Installer AWS CLI si nécessaire
if ! command -v aws &> /dev/null; then
    echo "0️⃣  Installation AWS CLI..."
    sudo apt-get update -qq
    sudo apt-get install -y awscli
    aws configure set region eu-west-3
    echo "✅ AWS CLI installé"
    echo ""
fi

# Vérifier que AWS CLI fonctionne
echo "🔍 Vérification IAM Role..."
ROLE_NAME=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/)
if [ -z "$ROLE_NAME" ]; then
    echo "❌ Aucun IAM Role attaché à cette instance!"
    echo "   Exécutez depuis votre Mac:"
    echo "   aws ec2 associate-iam-instance-profile --instance-id <ID> --iam-instance-profile Name=WhyNotFFmpegWorkerProfile"
    exit 1
fi
echo "✅ IAM Role: $ROLE_NAME"
echo ""

# 1. Télécharger l'image depuis S3
echo "1️⃣  Téléchargement de l'image Docker depuis S3..."
aws s3 cp s3://whynot-deployments/whynot-ffmpeg-worker-gpu.tar.gz . --region eu-west-3
echo "✅ Image téléchargée"
echo ""

# 2. Charger l'image Docker
echo "2️⃣  Chargement de l'image dans Docker..."
sudo docker load -i whynot-ffmpeg-worker-gpu.tar.gz
echo "✅ Image chargée"
echo ""

# 3. Récupérer variables d'environnement
echo "3️⃣  Récupération des secrets depuis Parameter Store..."
export REDIS_URL=$(aws ssm get-parameter \
  --name "/whynot/redis-url" \
  --with-decryption \
  --region eu-west-3 \
  --query "Parameter.Value" \
  --output text)

export AGORA_APP_ID=$(aws ssm get-parameter \
  --name "/whynot/agora-app-id" \
  --with-decryption \
  --region eu-west-3 \
  --query "Parameter.Value" \
  --output text)

export AGORA_APP_CERTIFICATE=$(aws ssm get-parameter \
  --name "/whynot/agora-app-certificate" \
  --with-decryption \
  --region eu-west-3 \
  --query "Parameter.Value" \
  --output text)

export CLOUDFLARE_ACCOUNT_ID=$(aws ssm get-parameter \
  --name "/whynot/cloudflare-account-id" \
  --with-decryption \
  --region eu-west-3 \
  --query "Parameter.Value" \
  --output text)

export CLOUDFLARE_API_TOKEN=$(aws ssm get-parameter \
  --name "/whynot/cloudflare-api-token" \
  --with-decryption \
  --region eu-west-3 \
  --query "Parameter.Value" \
  --output text)

echo "✅ Secrets récupérés"
echo ""

# 4. Lancer le container
echo "4️⃣  Lancement du container Docker..."
sudo docker run -d \
  --name ffmpeg-worker \
  --gpus all \
  --restart unless-stopped \
  -p 3001:3001 \
  -e REDIS_URL="$REDIS_URL" \
  -e AGORA_APP_ID="$AGORA_APP_ID" \
  -e AGORA_APP_CERTIFICATE="$AGORA_APP_CERTIFICATE" \
  -e CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
  -e CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
  -e NODE_ENV=production \
  -e PORT=3001 \
  whynot-ffmpeg-worker:gpu

echo "✅ Container démarré"
echo ""

# 5. Attendre que le container soit prêt
echo "5️⃣  Attente du démarrage du worker..."
sleep 5

# 6. Test health check
echo "6️⃣  Test du health check..."
if command -v jq &> /dev/null; then
    curl -s http://localhost:3001/health | jq .
else
    curl -s http://localhost:3001/health
fi

echo ""
echo "✅✅✅ Installation terminée !"
echo ""
echo "📊 État du container:"
sudo docker ps --filter "name=ffmpeg-worker"
echo ""
echo "📝 Pour voir les logs:"
echo "   sudo docker logs -f ffmpeg-worker"