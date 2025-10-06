const jwt = require('jsonwebtoken');
const User = require('../models/Usermodel');

module.exports.authmiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.Inventorymanagmentsystem;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }

        if (!token) {
            // Check if it's an API request
            if (req.originalUrl.startsWith('/api/')) {
                return res.status(401).json({ 
                    message: 'Access denied. No token provided.' 
                });
            } else {
                // Redirect to login for web requests
                return res.redirect('/login?message=Please login to continue&type=warning');
            }
        }

        const secretKey = "your-hardcoded-secret-key";
        const decoded = jwt.verify(token, secretKey);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            if (req.originalUrl.startsWith('/api/')) {
                return res.status(401).json({ 
                    message: 'User not found.' 
                });
            } else {
                return res.redirect('/login?message=User not found. Please login again&type=error');
            }
        }

        req.user = user;
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            ProfilePic: user.ProfilePic
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        // Clear invalid token
        res.cookie("Inventorymanagmentsystem", '', { maxAge: 0 });
        
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ 
                message: 'Invalid token.' 
            });
        } else {
            return res.redirect('/login?message=Session expired. Please login again&type=warning');
        }
    }
};

// Admin middleware with redirect support
module.exports.adminmiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(403).json({ 
                message: 'Access denied. Admin role required.' 
            });
        } else {
            return res.redirect('/dashboard?message=Access denied. Admin role required.&type=error');
        }
    }
};

// Manager middleware with redirect support
module.exports.managermiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
        next();
    } else {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(403).json({ 
                message: 'Access denied. Manager or Admin role required.' 
            });
        } else {
            return res.redirect('/dashboard?message=Access denied. Manager role required.&type=error');
        }
    }
};