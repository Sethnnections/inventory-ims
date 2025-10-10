const express=require("express")
const router=express.Router()
const {createCategory,RemoveCategory,getCategory,updateCategory,Searchcategory}=require('../controllers/categoryController')
const {authmiddleware,adminmiddleware,managermiddleware}=require('../middleware/Authmiddleware')



router.post("/createcategory",authmiddleware,createCategory)
router.get("/getcategory",getCategory)
router.get("/searchcategory",authmiddleware,Searchcategory)


router.delete("/removecategory/:CategoryId",authmiddleware,RemoveCategory)
router.put("/updateCategory",authmiddleware,updateCategory)







module.exports=router