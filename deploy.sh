#!/bin/bash

echo ""
echo "========================================="
echo "   FuelAlert Belgium Deploy"
echo "========================================="
echo ""

cd /root/fuelalert-belgium || exit 1

echo "📦 1/4 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build mislukt."
    exit 1
fi

echo ""
echo "🚀 2/4 Deploying frontend..."

rm -rf /var/www/fuelalertbe.app/*
cp -r dist/* /var/www/fuelalertbe.app/

echo ""
echo "📁 3/4 GitHub..."

git add .

git commit -m "Auto save $(date '+%Y-%m-%d %H:%M:%S')" || true

git push

echo ""
echo "🔄 4/4 Restart API..."

pm2 restart fuelalert-api

echo ""
echo "========================================="
echo "✅ FuelAlert succesvol gedeployed!"
echo "========================================="
echo ""