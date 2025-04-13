// render-server.js - Simple server for Render.com deployment
const express = require('express');
const path = require('path');
const app = express();

// Explicitly use the PORT provided by Render
const PORT = process.env.PORT || 10000;

console.log('🚀 Starting Render deployment server...');
console.log(`📊 Environment details: NODE_ENV=${process.env.NODE_ENV}, PORT=${PORT}`);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Handle all routes for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server with explicit host binding
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Listening on all interfaces (0.0.0.0:${PORT})`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ SERVER ERROR:', error.message);
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('🔴 UNCAUGHT EXCEPTION:', error.message);
  // Don't exit the process
});
