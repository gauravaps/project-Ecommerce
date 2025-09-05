import express from "express";
import { addOrder } from "../controllers/OrderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/authMiddleware.js"; 
const router = express.Router();






//Add order
 
router.post("/add-orders", verifyToken, addOrder);



export default router;