const express = require("express");
const { MongoDBconfig } = require('./libs/mongoconfig');
const { Server } = require("socket.io");
const http = require("http");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const authrouter = require('./Routers/authRouther');
const productrouter = require('./Routers/ProductRouter');
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
const PORT = process.env.PORT || 3003;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5000", // Update to match your frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5000", // Update to match your frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

const expressLayouts = require('express-ejs-layouts');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/base');

// Fix static file serving - serve from the correct directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Add middleware to make user data available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true })); // Add this for form data
app.set("io", io);
app.use(cookieParser());
app.use('/api/auth', authrouter);
app.use('/api/product', productrouter);
app.use('/api/order', orderrouter);
app.use('/api/category', categoryrouter);
app.use('/api/notification', notificationrouter);
app.use('/api/activitylogs', activityrouter(app));
app.use('/api/inventory', inventoryrouter);
app.use('/api/sales', salesrouter);
app.use('/api/supplier', supplierrouter);
app.use("/api/stocktransaction", stocktransactionrouter);

const viewrouter = require('./Routers/viewRouter');
app.use('/', viewrouter);



// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found' 
  });
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  // For API routes, return JSON error
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  }
  
  // For regular routes, send simple HTML error
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Server Error - Inventory System</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body text-center p-5">
                            <i class="fas fa-exclamation-triangle fa-4x text-danger mb-4"></i>
                            <h1>Server Error</h1>
                            <p class="text-muted">Something went wrong on our end. Please try again later.</p>
                            <a href="/" class="btn btn-primary mt-3">
                                <i class="fas fa-home me-2"></i>Go Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => {
  // For API routes
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  }
  
  // For regular routes
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Page Not Found - Inventory System</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body text-center p-5">
                            <i class="fas fa-map-signs fa-4x text-warning mb-4"></i>
                            <h1>404 - Page Not Found</h1>
                            <p class="text-muted">The page you're looking for doesn't exist.</p>
                            <a href="/" class="btn btn-primary mt-3">
                                <i class="fas fa-home me-2"></i>Go Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

server.listen(PORT, async () => {
  try {
    await MongoDBconfig();
    console.log(`The server is running at port ${PORT}`);
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
});

module.exports = { io, server };