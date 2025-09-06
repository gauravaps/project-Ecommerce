import express from "express";
const  router = express.Router();
import { verifyToken } from "../middleware/authMiddleware.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController/razorpayController.js";



router.post("/create-order-razorpay",verifyToken, createRazorpayOrder);
router.post("/verify-payment-razorpay", verifyToken, verifyRazorpayPayment);



export default router;
 