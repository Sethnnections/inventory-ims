const express = require("express");
const router = express.Router();
const { authmiddleware, adminmiddleware, managermiddleware } = require('../middleware/Authmiddleware');

// Public routes
router.get("/", (req, res) => {
  res.render("index", { 
    title: "Home",
    layout: 'layouts/base' 
  });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  
  // Get alert parameters from URL
  const alertMessage = req.query.message;
  const alertType = req.query.type;
  
  res.render("auth/login", { 
    title: "Login",
    layout: 'layouts/auth',
    alertMessage,
    alertType
  });
});

// Add alert handling to other routes if needed
router.get("/dashboard", authmiddleware, (req, res) => {
    const alertMessage = req.query.message;
    const alertType = req.query.type;
    
    res.render("dashboard", { 
        title: "Dashboard",
        user: req.session.user,
        layout: 'layouts/base',
        alertMessage,
        alertType
    });
});
// Admin only routes
router.get("/admin/users", authmiddleware, adminmiddleware, (req, res) => {
  res.render("admin/users", { 
    title: "User Management",
    user: req.session.user,
    layout: 'layouts/base'
  });
});

// Manager routes
router.get("/manager/inventory", authmiddleware, managermiddleware, (req, res) => {
  res.render("manager/inventory", { 
    title: "Inventory Management",
    user: req.session.user,
    layout: 'layouts/base'
  });
});

// Staff routes
router.get("/staff/products", authmiddleware, (req, res) => {
  res.render("staff/products", { 
    title: "Products",
    user: req.session.user,
    layout: 'layouts/base'
  });
});

// Profile route
router.get("/profile", authmiddleware, (req, res) => {
  res.render("profile", { 
    title: "Profile",
    user: req.session.user,
    layout: 'layouts/base'
  });
});

module.exports = router;