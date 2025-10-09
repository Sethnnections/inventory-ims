const mongoose=require('mongoose')

const ProductSchema= new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    Description:{
        type:String,
        required:true,
    },
    Category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    }, 
    Price:{
        type:Number,
        required:true,
    },
    quantity:{
        type:Number,
        default:0
    },
    image:{
        type:String,
    },
    supplier: { 
        type:String,
        default: null
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
},
{ timestamps: true }
)

const Product=mongoose.model("Product",ProductSchema)
module.exports=Product