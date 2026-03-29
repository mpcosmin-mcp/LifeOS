#!/bin/bash
# Start LifeOS (backend + frontend)
cd ~/LifeOS

# Kill existing
pkill -f "api/server.js"
pkill -f "serve dist"

# Start backend
nohup node api/server.js > /tmp/lifeos-api.log 2>&1 &

# Start frontend (SPA mode)
sleep 2
nohup npx serve dist -l 3456 --single > /tmp/lifeos-frontend.log 2>&1 &

echo "✅ LifeOS started:"
echo "   Frontend: http://localhost:3456"
echo "   Backend:  http://localhost:8787"
