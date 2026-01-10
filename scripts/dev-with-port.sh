#!/bin/bash

# Start dev server and detect which port it's actually using
# Then update NEXTAUTH_URL in .env.local if needed

PORT=${1:-3000}

echo "Starting Next.js dev server on port $PORT..."
echo "Updating NEXTAUTH_URL in .env.local to http://localhost:$PORT"

# Update .env.local with the actual port
sed -i.bak "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"http://localhost:$PORT\"|" .env.local

# Start the dev server
PORT=$PORT npm run dev
