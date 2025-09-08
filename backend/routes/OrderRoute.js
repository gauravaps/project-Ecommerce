import express from "express";
import { addOrder, getAllOrders, getMyOrders, getOrderById, updateOrderToDelivered } from "../controllers/OrderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/authMiddleware.js"; 
const router = express.Router();






//Add order 
router.post("/add-orders", verifyToken, addOrder);

// Get logged in user's orders
router.get("/myorders", verifyToken, getMyOrders);

// Get all orders (Admin only)
router.get("/all-orders", verifyToken, isAdmin, getAllOrders);


// Get order by Id
router.get("/single-order/:id", verifyToken, getOrderById);


//update order to delivered
router.put("/:id/delivered", verifyToken, isAdmin, updateOrderToDelivered);

export default router;