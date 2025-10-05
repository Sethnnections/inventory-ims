const mongoose=require("mongoose")


require("dotenv").config()

module.exports.MongoDBconfig=()=>{
    mongoose.connect("mongodb+srv://sethpatiencemanguluti_db_user:yw94gjnwLbnVG0kf@cluster0.7xgjpu6.mongodb.net/inventory?retryWrites=true&w=majority")
    .then(()=>{
        console.log("connected to database successfully")
    })
    .catch((err)=>{
        console.log("MonogoDB Connection Error",err)
    })

}
