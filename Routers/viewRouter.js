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


// Item management route
router.get("/admin/products", authmiddleware, adminmiddleware, (req, res) => {
  res.render("admin/products", { 
    title: "Item Management",
    user: req.session.user,
    headerIcon: 'boxes'
  });
});


router.get("/manager/inventory", authmiddleware, managermiddleware, (req, res) => {
  res.render("manager/inventory", { 
    title: "Inventory Management",
    user: req.session.user,
    headerIcon: 'warehouse'
  });
});


router.get("/manager/pos", authmiddleware, managermiddleware, (req, res) => {
  res.render("manager/pos", { 
    title: "Pos Management",
    user: req.session.user,
    headerIcon: 'warehouse'
  });
});

// Staff Item view
router.get("/staff/products", authmiddleware, (req, res) => {
  res.render("staff/products", { 
    title: "Items",
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