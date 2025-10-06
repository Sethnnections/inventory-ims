// scripts/createDefaultAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/Usermodel');
require('dotenv').config();

const createDefaultAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sethpatiencemanguluti_db_user:yw94gjnwLbnVG0kf@cluster0.7xgjpu6.mongodb.net/inventory?retryWrites=true&w=majority');
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'tm@inventory.com' });
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('tm@inventory.com', 10);
            const defaultAdmin = new User({
                name: 'System Administrator',
                email: 'tm@inventory.com',
                password: hashedPassword,
                role: 'admin',
                ProfilePic: ''
            });
            
            await defaultAdmin.save();
            console.log('✅ Default admin user created successfully!');
            console.log('📧 Email: tm@inventory.com');
            console.log('🔑 Password: admin123');
            console.log('⚠️  Please change the default password immediately!');
        } else {
            console.log('ℹ️  Default admin user already exists');
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error creating default admin:', error);
        process.exit(1);
    }
};

createDefaultAdmin();