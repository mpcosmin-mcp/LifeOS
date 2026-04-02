#!/bin/bash
# LifeOS Local Dashboard Startup (Tailscale-ready)

cd ~/LifeOS

# Kill old instances
pkill -f "api/server.js"
pkill -f "http.server 3456"

# Start backend (API)
cd api && nohup node server.js > /tmp/lifeos-api.log 2>&1 &
echo "✅ Backend started (port 8787)"

# Start frontend (static files)
cd .. && nohup python3 -m http.server 3456 --directory dist > /tmp/lifeos-frontend.log 2>&1 &
echo "✅ Frontend started (port 3456)"

# Show access URLs
TAILSCALE_IP=$(tailscale ip -4)
echo ""
echo "📊 LifeOS Dashboard ready:"
echo "   Local:     http://localhost:3456"
echo "   Tailscale: http://$TAILSCALE_IP:3456"
echo ""
