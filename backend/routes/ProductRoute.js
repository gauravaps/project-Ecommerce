import express from "express";
import { isAdmin, verifyToken } from "../middleware/authMiddleware.js";
import { addProduct } from "../controllers/ProductController.js";
import upload from "../middleware/multer.middileware.js";
const router = express.Router();








//Add new products..
router.post('/add-newproduct' ,  verifyToken , isAdmin , upload.single("image") , addProduct)







export default router;