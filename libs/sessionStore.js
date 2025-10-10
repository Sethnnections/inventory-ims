const session = require('express-session');
const MongoStore = require('connect-mongo');

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI || "mongodb+srv://sethpatiencemanguluti_db_user:yw94gjnwLbnVG0kf@cluster0.7xgjpu6.mongodb.net/inventory?retryWrites=true&w=majority",
  collectionName: 'sessions',
  ttl: 24 * 60 * 60 // 1 day
});

module.exports = sessionStore;