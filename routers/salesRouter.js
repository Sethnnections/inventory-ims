const express = require("express");
const router = express.Router();
const {
  createSale,
  createSaleSimple, // Add the simple version
  getAllSales,
  getSale,
  getTodaySales,
  getSalesStats
} = require('../controllers/salesController');
const { authmiddleware } = require('../middleware/Authmiddleware');

// Use the simple version for now to avoid validation issues
router.post("/", authmiddleware, createSaleSimple);
router.get("/", authmiddleware, getAllSales);
router.get("/today", authmiddleware, getTodaySales);
router.get("/stats", authmiddleware, getSalesStats);
router.get("/:saleId", authmiddleware, getSale);

module.exports = router;