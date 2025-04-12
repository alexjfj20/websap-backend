// CORS configuration for the backend API
module.exports = {
  // Allow requests from these origins
  allowedOrigins: [
    'https://allseo.xyz',  // Main production domain
    'https://allseo.xyz/websap',  // App subdirectory
    'http://localhost:8080',  // Vue dev server
    'http://localhost:8081', 
    'http://localhost:3000'  // Local development
  ],
  
  // CORS options for Express
  corsOptions: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = module.exports.allowedOrigins;
      
      // Check if the origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true); // Origin allowed
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        // For development, you can enable all origins and comment this out
        callback(null, true); // Allow anyway for testing
        // callback(new Error('Not allowed by CORS')); // Block in production
      }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Function to configure Express app with CORS
  setupCORS: function(app) {
    const cors = require('cors');
    app.use(cors(this.corsOptions));
    
    // Add preflight OPTIONS response for all routes
    app.options('*', cors(this.corsOptions));
  }
};