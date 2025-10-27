#!/bin/bash

# FHE Lucky Spin Startup Script

echo "🎯 FHE Lucky Spin DApp Startup Script"
echo "====================================="

# Check Node.js version
echo "📋 Checking environment..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed, please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version too low, requires 18+, current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if dependencies are installed
if [ ! -d "contracts/node_modules" ]; then
    echo "📦 Installing smart contract dependencies..."
    cd contracts
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "✅ Dependencies installed"

# Check environment variables
echo "🔧 Checking configuration..."

if [ ! -f "contracts/.env" ]; then
    echo "⚠️  contracts/.env file not found"
    echo "Please create contracts/.env file and set the following variables:"
    echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
    echo "DEPLOYER_PRIVATE_KEY=your_private_key_here"
    echo ""
    echo "Then run: npm run deploy:sepolia"
    echo ""
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local file not found"
    echo "Please create frontend/.env.local file and set contract address"
    echo ""
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
cd contracts
npm run compile
if [ $? -ne 0 ]; then
    echo "❌ Contract compilation failed"
    exit 1
fi
cd ..

echo "✅ Contract compilation successful"

# Start frontend
echo "🚀 Starting frontend application..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Frontend application started"
echo "🌐 Access URL: http://localhost:3000"
echo ""
echo "📋 Usage Instructions:"
echo "1. Connect MetaMask wallet"
echo "2. Switch to Sepolia network"
echo "3. Start spinning the wheel"
echo ""
echo "Press Ctrl+C to stop the application"

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping application...'; kill $FRONTEND_PID; exit 0" INT
wait $FRONTEND_PID
