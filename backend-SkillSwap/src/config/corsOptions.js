const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://skillswap-01.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow any incoming origin in production / development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

module.exports = corsOptions;
