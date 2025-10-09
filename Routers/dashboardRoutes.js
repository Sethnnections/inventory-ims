const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
const { authmiddleware } = require('../middleware/Authmiddleware');

// Apply auth middleware to all dashboard routes
router.use(authmiddleware);

// Main dashboard route
router.get('/', dashboardController.getDashboardStats);

// API routes for dashboard data
router.get('/stats', dashboardController.getDashboardStats);
router.get('/realtime', dashboardController.getRealTimeStats);

module.exports = router;