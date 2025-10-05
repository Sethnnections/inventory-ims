const express = require("express");
const router = express.Router();
const { authmiddleware, adminmiddleware, managermiddleware } = require('../middleware/Authmiddleware');

// Public routes
router.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render("auth/login", { title: "Login" });
});

router.get("/dashboard", authmiddleware, (req, res) => {
    res.render("dashboard", { 
        title: "Dashboard",
        user: req.session.user 
    });
});
// Admin only routes
router.get("/admin/users", adminmiddleware, (req, res) => {
  res.render("admin/users", { 
    title: "User Management",
    user: req.session.user 
  });
});

// Manager routes
router.get("/manager/inventory", managermiddleware, (req, res) => {
  res.render("manager/inventory", { 
    title: "Inventory Management",
    user: req.session.user 
  });
});

// Staff routes
router.get("/staff/products", authmiddleware, (req, res) => {
  res.render("staff/products", { 
    title: "Products",
    user: req.session.user 
  });
});

// Profile route
router.get("/profile", authmiddleware, (req, res) => {
  res.render("profile", { 
    title: "Profile",
    user: req.session.user 
  });
});

module.exports = router;