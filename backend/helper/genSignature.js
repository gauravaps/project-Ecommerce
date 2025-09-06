import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post("/generate-signature" , (req, res) => {
  const { razorpay_order_id, razorpay_payment_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  return res.json({ signature });
});

export default router;
