import express from "express";
const  router = express.Router();
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController/razorpayController.js";
import { verifyToken } from "../middleware/authMiddleware.js";



router.post("/create-order",verifyToken, createRazorpayOrder);
router.post("/verify-payment", verifyToken, verifyRazorpayPayment);



export default router;
