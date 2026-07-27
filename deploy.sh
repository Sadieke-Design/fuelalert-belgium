#!/bin/bash

set -e

PROJECT_DIR="/root/fuelalert-belgium"
DEPLOY_DIR="/var/www/fuelalertbe.app"
RELEASE_DIR="$PROJECT_DIR/releases"

echo ""
echo "===================================================="
echo "        FuelAlert Belgium Deployment"
echo "===================================================="
echo ""

cd "$PROJECT_DIR" || {
    echo "❌ Projectmap niet gevonden."
    exit 1
}

####################################################
# 1. Git
####################################################

echo "📁 Stap 1/5 - Git synchroniseren..."
echo ""

git add .

if git diff --cached --quiet; then
    echo "ℹ️  Geen wijzigingen om te committen."
else
    git commit -m "Auto deploy $(date '+%Y-%m-%d %H:%M:%S')"
fi

git push

echo "✅ Git succesvol bijgewerkt."
echo ""

####################################################
# 2. Build
####################################################

echo "🏗️  Stap 2/5 - Project bouwen..."
echo ""

npm run build

echo "✅ Build succesvol."
echo ""

####################################################
# 3. Deploy Frontend
####################################################

echo "🚀 Stap 3/5 - Frontend deployen..."
echo ""

rm -rf "${DEPLOY_DIR:?}"/*
cp -r dist/* "$DEPLOY_DIR/"

echo "✅ Frontend gedeployed."
echo ""

####################################################
# 4. Restart API
####################################################

echo "🔄 Stap 4/5 - API herstarten..."
echo ""

pm2 restart fuelalert-api

echo "✅ API opnieuw gestart."
echo ""

####################################################
# 5. Release ZIP
####################################################

echo "📦 Stap 5/5 - Release maken..."
echo ""

mkdir -p "$RELEASE_DIR"

VERSION=$(date '+%Y.%m.%d-%H%M')

ZIPFILE="$RELEASE_DIR/fuelalert-belgium-$VERSION.zip"

git archive \
    --format=zip \
    --output="$ZIPFILE" \
    HEAD

echo "✅ Release aangemaakt:"
echo "   $ZIPFILE"

SIZE=$(du -h "$ZIPFILE" | cut -f1)

echo "📏 Grootte: $SIZE"

echo ""
echo "===================================================="
echo "          ✅ Deployment voltooid!"
echo "===================================================="
echo ""
echo "Git       : ✔"
echo "Build     : ✔"
echo "Deploy    : ✔"
echo "API       : ✔"
echo "Release   : ✔"
echo ""
echo "Releasebestand:"
echo "$ZIPFILE"
echo ""