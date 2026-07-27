#!/bin/bash

set -e

VERSION="v8.4.0"
DATE=$(date +"%Y%m%d-%H%M")

PROJECT="$HOME/fuelalert-belgium"
RELEASES="$PROJECT/releases"

mkdir -p "$RELEASES"

OUT="$RELEASES/fuelalert-belgium-${VERSION}-${DATE}.tar.gz"

echo "========================================"
echo " FuelAlert Release Creator"
echo "========================================"

tar \
--exclude='./node_modules' \
--exclude='./backend/node_modules' \
--exclude='./dist' \
--exclude='./build' \
--exclude='./.git' \
--exclude='./.vscode' \
--exclude='./releases' \
--exclude='./backend/data/*.osm.pbf' \
-czvf "$OUT" \
-C "$PROJECT" .

echo ""
echo "========================================"
echo "Release gemaakt:"
echo "$OUT"
echo "========================================"

ls -lh "$OUT"