import express from "express";
import { isAdmin, verifyToken } from "../middleware/authMiddleware.js";
import { addProduct, deleteProduct, updateProduct } from "../controllers/ProductController.js";
import upload from "../middleware/multer.middileware.js";
import { addReview } from "../controllers/Reviewcontroller.js";
const router = express.Router();








//Add new products..
router.post('/add-newproduct' ,  verifyToken , isAdmin , upload.single("image") , addProduct);


//Update products details..
router.put( "/update-product/:id" , verifyToken , isAdmin , upload.single("image") , updateProduct);


//Add ratings and comments on the given order product by login user..
router.post('/add_rating_comment' , verifyToken , addReview);


//// Delete Product 
router.delete("/delete-product/:id" , verifyToken ,isAdmin ,deleteProduct)







export default router;