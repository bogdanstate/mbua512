#!/bin/bash
# Quick start script for local mobile testing

set -e

echo "========================================="
echo "Starting MBUA512 Local Slide Server"
echo "========================================="
echo ""

# Start Docker container
echo "Starting Docker container..."
docker-compose up -d

echo ""
echo "✓ Server started successfully!"
echo ""

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "========================================="
echo "Access slides from your mobile device:"
echo "========================================="
echo ""
echo "1. Connect your phone to the same WiFi network"
echo "2. Open your browser and go to:"
echo ""
echo "   http://${LOCAL_IP}:8080/week-10/"
echo ""
echo "   or"
echo ""
echo "   http://${LOCAL_IP}:8080/week-9/"
echo ""
echo "========================================="
echo ""
echo "Useful URLs:"
echo "  - Week 10: http://${LOCAL_IP}:8080/week-10/"
echo "  - Week 9:  http://${LOCAL_IP}:8080/week-9/"
echo "  - With debug console: http://${LOCAL_IP}:8080/week-10/?debug"
echo "  - Specific slide: http://${LOCAL_IP}:8080/week-10/?slide=8"
echo ""
echo "To stop the server:"
echo "  docker-compose down"
echo ""
echo "For troubleshooting, see README-DOCKER.md"
echo "========================================="
