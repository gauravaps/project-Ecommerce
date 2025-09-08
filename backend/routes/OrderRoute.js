import express from "express";
import { addOrder, getMyOrders } from "../controllers/OrderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/authMiddleware.js"; 
const router = express.Router();






//Add order 
router.post("/add-orders", verifyToken, addOrder);

// Get logged in user's orders
router.get("/myorders", verifyToken, getMyOrders);

export default router;