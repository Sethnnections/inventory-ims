const express = require("express");
const router = express.Router();
const {
    Addproduct,
    getProduct,
    RemoveProduct,
    EditProduct,
    SearchProduct,
    getTopProductsByQuantity,
    getProductById,
    updateProductQuantity
} = require('../controller/productcontroller2');
const { authmiddleware, adminmiddleware, managermiddleware } = require('../middleware/Authmiddleware');

// Public routes
router.get("/getproducts", getProduct);
router.get("/getproduct/:productId", getProductById);
router.get("/searchproducts", SearchProduct);
router.get("/topproducts", getTopProductsByQuantity);

// Protected routes - require authentication
router.post("/createproduct", authmiddleware, managermiddleware, Addproduct);
router.put("/updateproduct/:productId", authmiddleware, managermiddleware, EditProduct);
router.delete("/deleteproduct/:productId", authmiddleware, managermiddleware, RemoveProduct);
router.patch("/updatequantity/:productId", authmiddleware, managermiddleware, updateProductQuantity);

module.exports = router;