const express = require("express");
const { MongoDBconfig } = require('./libs/mongoconfig');
const { Server } = require("socket.io");
const http = require("http");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const authrouter = require('./Routers/authRouther');
const productrouter = require('./Routers/ProductRouter');
const ProductRouter2 = require('./Routers/productRouter');
const orderrouter = require('./Routers/orderRouter');
const categoryrouter = require("./Routers/categoryRouter")
const notificationrouter = require("./Routers/notificationRouters");
const activityrouter = require("./Routers/activityRouter");
const inventoryrouter = require('./Routers/inventoryRouter');
const salesrouter = require('./Routers/salesRouter');
const supplierrouter = require('./Routers/supplierrouter');
const stocktransactionrouter = require('./Routers/stocktransactionrouter');
const session = require('express-session');
const path = require('path');

require("dotenv").config();

const app = express();

// For serverless, we need to handle both HTTP and serverless environments
let server;
let io;

if (process.env.VERCEL) {
  // Serverless environment
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5000",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });
} else {
  // Local development
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5000",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });
}

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

// View engine setup
const expressLayouts = require('express-ejs-layouts');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/base');

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  },
  store: process.env.VERCEL ? 
    new session.MemoryStore() : // Use MemoryStore for serverless (note: sessions won't persist between invocations)
    undefined
}));

// Make user data available in views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Socket.io setup
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.set("io", io);
app.use(cookieParser());

// API Routes
app.use('/api/auth', authrouter);
app.use('/api/product', ProductRouter2);
app.use('/api/order', orderrouter);
app.use('/api/category', categoryrouter);
app.use('/api/notification', notificationrouter);
app.use('/api/activitylogs', activityrouter(app));
app.use('/api/inventory', inventoryrouter);
app.use('/api/sales', salesrouter);
app.use('/api/supplier', supplierrouter);
app.use("/api/stocktransaction", stocktransactionrouter);

// View Routes
const viewrouter = require('./Routers/viewRouter');
app.use('/', viewrouter);

// Dashboard Routes
const dashboardrouter = require('./Routers/dashboardRoutes');
app.use('/dashboard', dashboardrouter);
app.use('/api/dashboard', dashboardrouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  }
  
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

// 404 handler
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  }
  
  res.status(404).render('404', {
    title: 'Page Not Found'
  });
});

// Serverless function handler
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // Local development server
  const PORT = process.env.PORT || 3003;
  
  server.listen(PORT, async () => {
    try {
      await MongoDBconfig();
      console.log(`The server is running at port ${PORT}`);
      console.log('connected to database successfully');
    } catch (err) {
      console.error("Failed to connect to MongoDB:", err);
    }
  });

  module.exports = { io, server };
}