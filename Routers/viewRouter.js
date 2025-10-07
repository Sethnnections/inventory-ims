const express = require("express");
const router = express.Router();
const { authmiddleware, adminmiddleware, managermiddleware } = require('../middleware/Authmiddleware');

// Public routes
router.get("/", (req, res) => {
  res.render("index", { 
    title: "Home"
  });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  
  const alertMessage = req.query.message;
  const alertType = req.query.type;
  
  res.render("auth/login", { 
    title: "Login",
    layout: 'layouts/auth',
    alertMessage,
    alertType
  });
});

// Dashboard with role-based access
router.get("/dashboard", authmiddleware, (req, res) => {
    const alertMessage = req.query.message;
    const alertType = req.query.type;
    
    res.render("dashboard", { 
        title: "Dashboard",
        user: req.session.user,
        alertMessage,
        alertType
    });
});

// Admin only routes
router.get("/admin/users", authmiddleware, adminmiddleware, (req, res) => {
  res.render("admin/users", { 
    title: "User Management",
    user: req.session.user,
    headerIcon: 'users'
  });
});

// Manager routes
router.get("/manager/inventory", authmiddleware, managermiddleware, (req, res) => {
  res.render("manager/inventory", { 
    title: "Inventory Management",
    user: req.session.user,
    headerIcon: 'warehouse'
  });
});


// Category management route
router.get("/admin/categories", authmiddleware, adminmiddleware, (req, res) => {
  res.render("admin/categories", { 
    title: "Category Management",
    user: req.session.user,
    headerIcon: 'tags'
  });
});

// Product management route
router.get("/admin/products", authmiddleware, adminmiddleware, (req, res) => {
  res.render("admin/products", { 
    title: "Product Management",
    user: req.session.user,
    headerIcon: 'boxes'
  });
});

// Staff product view
router.get("/staff/products", authmiddleware, (req, res) => {
  res.render("staff/products", { 
    title: "Products",
    user: req.session.user,
    headerIcon: 'box'
  });
});

// Profile route
router.get("/profile", authmiddleware, (req, res) => {
  res.render("profile", { 
    title: "Profile",
    user: req.session.user,
    headerIcon: 'user'
  });
});

module.exports = router;