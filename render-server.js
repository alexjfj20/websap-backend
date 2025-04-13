// render-server.js - Ultra-simple server for Render.com
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0'; // Explicitly listen on all interfaces

console.log(`[Render Server] Attempting to start server on ${HOST}:${PORT}`);
console.log(`[Render Server] Node version: ${process.version}`);
console.log(`[Render Server] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[Render Server] Current directory: ${__dirname}`);

// Basic request handler
const requestHandler = (req, res) => {
  console.log(`[Render Server] Received request: ${req.method} ${req.url}`);

  // Serve index.html for root, otherwise 404
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error('[Render Server] Error reading index.html:', err);
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', port: PORT, timestamp: new Date().toISOString() }));
  } else {
    // Basic 404 for other paths for now
    res.writeHead(404);
    res.end('Not Found');
  }
};

// Create the server
const server = http.createServer(requestHandler);

// Error handling
server.on('error', (err) => {
  console.error('[Render Server] Server error:', err);
});

// Start listening
server.listen(PORT, HOST, () => {
  console.log(`[Render Server] ✅ Server successfully listening on ${HOST}:${PORT}`);
});

console.log('[Render Server] Server script finished initial execution.');

// Keep process alive (optional, but sometimes helps in certain environments)
// setInterval(() => {
//   console.log('[Render Server] Heartbeat...');
// }, 60000); // Log every minute
