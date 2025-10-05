const jwt = require('jsonwebtoken');
const User = require('../models/Usermodel');

module.exports.authmiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.Inventorymanagmentsystem;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }

        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }
        const secretKey = "your-hardcoded-secret-key";
        const decoded = jwt.verify(token, secretKey);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                message: 'User not found.' 
            });
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
        return res.status(401).json({ 
            message: 'Invalid token.' 
        });
    }
};

module.exports.adminmiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            message: 'Access denied. Admin role required.' 
        });
    }
};

module.exports.managermiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ 
            message: 'Access denied. Manager or Admin role required.' 
        });
    }
};