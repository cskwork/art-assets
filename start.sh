#!/bin/bash
# 3D Viewer 로컬 서버 시작 스크립트 (Unix/Linux/Mac)

echo "Starting local server for 3D viewer..."
echo ""
echo "Server will be available at: http://localhost:3000"
echo "3D Viewer: http://localhost:3000/3d/viewer.html"
echo "Gallery: http://localhost:3000/gallery.html"
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

npx serve -p 3000
