'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// CORS middleware (basic setup for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Campus Navigation API is running',
    timestamp: new Date().toISOString(),
    service: 'campus-navigation-api',
  });
});
// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Campus Navigation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      routes: '/routes (coming soon)',
      search: '/search (coming soon)',
    },
  });
});
// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
});
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});
app.listen(port, () => {
  console.log(`🚀 Campus Navigation API server is running on port ${port}`);
  console.log(`📋 Health check available at: http://localhost:${port}/health`);
});
//# sourceMappingURL=index.js.map
