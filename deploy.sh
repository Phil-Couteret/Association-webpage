#!/bin/bash

# Simple deployment script - build and deploy to production
# Usage: ./deploy.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Building and deploying to production...${NC}\n"

# Build
echo -e "${GREEN}Building...${NC}"
npm run build

# Copy to deployment
echo -e "${GREEN}Preparing deployment files...${NC}"
cp -r dist/* deployment/
# Fix permissions - files should be 644, directories should be 755
find deployment -type f -exec chmod 644 {} \;
find deployment -type d -exec chmod 755 {} \;
# DO NOT copy PHP files - they might overwrite working server files
# cp api/*.php deployment/api/ 2>/dev/null || true
# DO NOT copy .htaccess - OVH has the original working version
# cp api/.htaccess deployment/api/ 2>/dev/null || true

# DO NOT overwrite config.php - it's managed separately
# If you need to update config.php, use: ./fix-config-only.sh
# cp api/config-ovh-production.php deployment/api/config.php

# Deploy
echo -e "${GREEN}Deploying to OVH...${NC}"

# Load FTP credentials from .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FTP_HOST="${FTP_HOST:-ftp.cluster129.hosting.ovh.net}"
FTP_USER="${FTP_USER:-elektry}"
FTP_DIR="/www"

if [ -z "$FTP_PASSWORD" ]; then
    echo -n "Enter FTP password: "
    read -s FTP_PASSWORD
    echo ""
fi

lftp -u "$FTP_USER,$FTP_PASSWORD" "$FTP_HOST" <<EOF
set ftp:ssl-allow no
set ftp:passive-mode yes
cd $FTP_DIR

# Upload frontend (dist contents)
mirror -R deployment/ . --exclude-glob="*.md" --exclude-glob="FINAL_*" --exclude-glob="README*" --exclude-glob=".htaccess"

# Upload API files — NEVER overwrite live config.php / smtp on server.
# Do NOT use "config-*.php" (that would skip config-helper.php and break half the API).
mirror -R api/ api \
  --exclude-glob="config.php" \
  --exclude-glob=".htaccess" \
  --exclude-glob="smtp-config.php" \
  --exclude-glob="config-ovh*.php" \
  --exclude-glob="config-template.php"

bye
EOF

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Deployed successfully!${NC}"
    echo -e "${YELLOW}Clear browser cache (Cmd+Shift+R) to see changes${NC}"
else
    echo -e "\n${RED}❌ Deployment failed!${NC}"
    exit 1
fi

