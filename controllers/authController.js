const User = require('../models/Usermodel');
const bcrypt = require("bcryptjs");
const generateToken = require('../libs/Tokengenerator');
const Cloundinary = require('../libs/Cloundinary');
const logActivity = require('../libs/logger');

// Only admin can create new users
module.exports.signup = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: "Access denied. Only admin can create new users." 
            });
        }

        const { name, email, password, ProfilePic, role } = req.body;

        // Validate role
        const allowedRoles = ['admin', 'manager', 'staff'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ 
                error: "Invalid role. Allowed roles: admin, manager, staff" 
            });
        }

        // Check if user already exists
        const duplicatedUser = await User.findOne({ email });
        if (duplicatedUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedpassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedpassword,
            ProfilePic: "",
            role,
        });

        const savedUser = await newUser.save();

        // Log the activity
        await logActivity({
            action: "User Created",
            description: `Admin ${req.user.name} created new ${role} user: ${name}`,
            entity: "user",
            entityId: savedUser._id,
            userId: req.user._id,
            ipAddress: req.ip,
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                ProfilePic: savedUser.ProfilePic,
            },
        });

    } catch (error) {
        console.error("Error during user creation:", error.message);
        res.status(400).json({ error: "Error during user creation: " + error.message });
    }
};

// Update login to handle default admin
module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = await generateToken(user, res);

        // Set session data
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            ProfilePic: user.ProfilePic,
            token: token
        };

        // Activity logging
        await logActivity({
            action: "User Login",
            description: `User ${user.name} logged in.`,
            entity: "user",
            entityId: user._id,
            userId: user._id,
            ipAddress: ipAddress,
        });

        return res.status(200).json({
            message: "Login successful",
            user: req.session.user
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Error during login"
        });
    }
};

// Only admin can delete users
module.exports.removeuser = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: "Access denied. Only admin can delete users." 
            });
        }

        const { UserId } = req.params;

        // Prevent admin from deleting themselves
        if (UserId === req.user.id) {
            return res.status(400).json({ 
                message: "Cannot delete your own account." 
            });
        }

        if (!UserId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const deleteUser = await User.findByIdAndDelete(UserId);

        if (!deleteUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Log the activity
        await logActivity({
            action: "User Deleted",
            description: `Admin ${req.user.name} deleted user: ${deleteUser.name}`,
            entity: "user",
            entityId: UserId,
            userId: req.user._id,
            ipAddress: req.ip,
        });

        return res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.logout = async (req, res) => {
  try {
    // Clear the cookie
    res.cookie("Inventorymanagmentsystem", '', { maxAge: 0 });
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      
      // Redirect to login with success message
      res.redirect('/login?message=Logged out successfully&type=success');
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.redirect('/login?message=Error during logout&type=error');
  }
};


// Update user profile (Admin only)
module.exports.updateUser = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: "Access denied. Only admin can update users." 
            });
        }

        const { userId } = req.params;
        const { name, email, role, ProfilePic } = req.body;

        // Validate role
        const allowedRoles = ['admin', 'manager', 'staff'];
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ 
                error: "Invalid role. Allowed roles: admin, manager, staff" 
            });
        }

        // Check if email already exists for other users
        if (email) {
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: userId } 
            });
            if (existingUser) {
                return res.status(400).json({ error: "Email already exists" });
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (ProfilePic) updateData.ProfilePic = ProfilePic;

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Log the activity
        await logActivity({
            action: "User Updated",
            description: `Admin ${req.user.name} updated user: ${updatedUser.name}`,
            entity: "user",
            entityId: updatedUser._id,
            userId: req.user._id,
            ipAddress: req.ip,
        });

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(400).json({ error: "Error updating user: " + error.message });
    }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { ProfilePic } = req.body;
    const userId = req.user?._id;
    const ipAddress = req.ip; 

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    if (ProfilePic) {
      try {
       
        const uploadResponse = await Cloundinary.uploader.upload(ProfilePic, {
          folder: "profile_inventory_system", 
          upload_preset: "upload", 
        });

        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { ProfilePic: uploadResponse.secure_url },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
          message: "Profile updated successfully",
          updatedUser
        });
        

      } catch (cloudinaryError) {
        console.error("Cloudinary upload failed:", cloudinaryError);
        return res.status(500).json({ message: "Image upload failed", error: cloudinaryError.message });
      }
    } else {
      return res.status(400).json({ message: "No profile picture provided" });
    }
  } catch (error) {
    console.error("Error in update profile Controller", error.message);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports.staffuser = async (req, res) => {
  try {
    const staffuser = await User.find({ role: "staff" }).select("-password");

    if (staffuser.length === 0) {
      return res.status(200).json([]); // Return empty array instead of message
    }

    res.status(200).json(staffuser); // Direct array response
  } catch (error) {
    console.log("Error in get staff Controller:", error.message);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports.manageruser = async (req, res) => {
  try {
    const manageruser = await User.find({ role: "manager" }).select("-password");

    if (manageruser.length === 0) {
      return res.status(200).json([]); // Return empty array
    }

    res.status(200).json(manageruser); // Direct array response
  } catch (error) {
    console.log("Error in get manager Controller:", error.message);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports.adminuser = async (req, res) => {
  try {
    const adminuser = await User.find({ role: "admin" }).select("-password");

    if (adminuser.length === 0) {
      return res.status(200).json([]); // Return empty array
    }

    res.status(200).json(adminuser); // Direct array response
  } catch (error) {
    console.log("Error in get admin Controller:", error.message);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}