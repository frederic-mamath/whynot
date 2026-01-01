#!/usr/bin/env node

// Simple WebSocket connection test
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened!');
  console.log('🎉 Phase 1 Complete: WebSocket Server is running');
  
  // Close after success
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 1000);
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket connection failed:', err.message);
  process.exit(1);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
});
