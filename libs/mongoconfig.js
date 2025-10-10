const mongoose = require("mongoose");
require("dotenv").config();

// Cache the connection to handle serverless environments
let cachedConnection = null;

module.exports.MongoDBconfig = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb+srv://sethpatiencemanguluti_db_user:yw94gjnwLbnVG0kf@cluster0.7xgjpu6.mongodb.net/inventory?retryWrites=true&w=majority",
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );
    
    cachedConnection = connection;
    console.log("Connected to database successfully");
    return connection;
  } catch (err) {
    console.error("MongoDB Connection Error", err);
    throw err;
  }
};