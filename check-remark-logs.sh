#!/bin/bash
# Script zum Überprüfen der Remark42 Admin API Dokumentation

echo "=== Überprüfe Remark42 Container Umgebung ==="
docker exec remark42 env | grep -E "(ADMIN|AUTH)" | sort

echo ""
echo "=== Teste ob Admin-Endpunkt andere Authentifizierung braucht ==="
echo "Schaue in Remark42 Source Code nach Admin-Authentifizierung..."

# Zeige Remark42 Version
docker exec remark42 /srv/remark42 --version 2>/dev/null || echo "Konnte Version nicht abrufen"
