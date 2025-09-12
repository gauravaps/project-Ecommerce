import express from "express";
const  router = express.Router();
import { verifyToken } from "../middleware/authMiddleware.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController/razorpayController.js";
import { capturePaypalPayment, createPaypalOrder } from "../controllers/paymentController/paypalController.js";
import { confirmStripePayment, createStripeCheckoutSession, createStripePaymentIntent, verifyCheckoutSession } from "../controllers/paymentController/stripeController.js";


// Razorpay Payment Routes
router.post("/create-order-razorpay",verifyToken, createRazorpayOrder);
router.post("/verify-payment-razorpay", verifyToken, verifyRazorpayPayment);

//Paypal Payment Routes ..
router.post("/create-order-paypal", verifyToken, createPaypalOrder);
router.post("/capture-payment-paypal", verifyToken, capturePaypalPayment);

 
// Stripe Payment Routes
router.post("/create-payment-stripe", verifyToken, createStripePaymentIntent);
router.post("/confirm-payment-stripe", verifyToken, confirmStripePayment); 

// Stripe Checkout Session optional (frontend redirect to Stripe hosted page)
//use this route for production********
router.post("/create-checkout-session", verifyToken, createStripeCheckoutSession);
router.post("/verify-checkout-session", verifyToken, verifyCheckoutSession); 



export default router; 
 