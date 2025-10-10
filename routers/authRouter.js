const express = require("express");
const router = express.Router();
const {
    signup,
    login,
    updateProfile,
    logout,
    staffuser,
    manageruser,
    adminuser,
    updateUser,
    removeuser
} = require('../controllers/authController');
const {
    authmiddleware,
    adminmiddleware
} = require('../middleware/Authmiddleware');

// Public routes
router.post("/login", login);

// Protected routes - Only admin can create/delete users
router.post("/signup", authmiddleware, adminmiddleware, signup);
router.delete("/removeuser/:UserId", authmiddleware, adminmiddleware, removeuser);

// User management routes - accessible based on role
router.get("/staffuser", authmiddleware, staffuser);
router.get("/manageruser", authmiddleware, manageruser);
router.get("/adminuser", authmiddleware, adminmiddleware, adminuser); // Only admin can view other admins
router.put("/updateuser/:userId", authmiddleware, adminmiddleware, updateUser);

// User profile routes
router.post("/logout", authmiddleware, logout);
router.put("/updateProfile", authmiddleware, updateProfile);

module.exports = router;