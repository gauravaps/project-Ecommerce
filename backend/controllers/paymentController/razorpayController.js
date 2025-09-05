import Razorpay from "razorpay";
import crypto from "crypto";
import PaymentModel from "../../models/PaymentModel.js";
import Order from "../../models/OrderModel.js";
 
// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: rupees -> paise
const toPaise = (amountInRupee) => Math.round(Number(amountInRupee) * 100);

// 1) Create Razorpay Order for an existing DB Order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body; // your DB Order _id

    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await Order.findById(orderId).populate("user", "email name");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Security: ensure order belongs to current user (except admin)
if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
  return res.status(403).json({ message: "Not allowed for this order" });
}


    if (order.totalPrice <= 0) {
      return res.status(400).json({ message: "Invalid order total" });
    }

    // Prepare Razorpay order
    const options = {
      amount: toPaise(order.totalPrice), 
      currency: "INR",
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Create/Upsert Payment record
    const payment = await PaymentModel.findOneAndUpdate(
      { order: order._id, user: req.user._id },
      {
        user: req.user._id,
        order: order._id,
        paymentMethod: "razorpay",
        orderId: rzpOrder.id,
        amount: order.totalPrice,
        currency: "INR",
        status: "created",
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      message: "Razorpay order created",
      key_id: process.env.RAZORPAY_KEY_ID,
      order: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
      paymentRecordId: payment._id,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2) Verify Payment after checkout success
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    // orderId = your DB Order _id (not Razorpay order id)

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      // Mark payment failed
      await PaymentModel.findOneAndUpdate(
        { order: orderId, user: req.user._id, orderId: razorpay_order_id },
        {
          status: "failed",
          razorpay_payment_id,
          razorpay_signature,
        }
      );
      return res.status(400).json({ message: "Signature verification failed" });
    }

    // Update Payment record
    await PaymentModel.findOneAndUpdate(
      { order: orderId, user: req.user._id, orderId: razorpay_order_id },
      {
        status: "completed",
        razorpay_payment_id,
        razorpay_signature,
      }
    );

    // Update Order -> mark as paid
    const paidOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        isPaid: true,
        paidAt: new Date(),
        paymentMethod: "razorpay",
        paymentResult: {
          id: razorpay_payment_id,
          status: "captured",
          update_time: new Date().toISOString(),
          email_address: req.user?.email || "",
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Payment verified & order marked as paid",
      order: paidOrder,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};




// 3) OPTIONAL: Razorpay Webhook (as backup)
// export const razorpayWebhook = async (req, res) => {
//   try {
//     const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const signature = req.headers["x-razorpay-signature"];

//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(req.body.toString());
//     const digest = shasum.digest("hex");

//     if (digest !== signature) {
//       return res.status(400).json({ message: "Invalid webhook signature" });
//     }

//     const event = JSON.parse(req.body.toString());

//     // Example: handle payment.captured
//     if (event.event === "payment.captured") {
//       const payment = event.payload.payment.entity;
//       const rzpOrderId = payment.order_id;

//       // Find payment record by provider order id
//       const payDoc = await PaymentModel.findOne({ orderId: rzpOrderId }).populate("order");
//       if (payDoc) {
//         // Mark payment as completed if not already
//         if (payDoc.status !== "completed") {
//           payDoc.status = "completed";
//           payDoc.razorpay_payment_id = payment.id;
//           await payDoc.save();

//           // Mark order paid
//           await Order.findByIdAndUpdate(
//             payDoc.order._id,
//             {
//               isPaid: true,
//               paidAt: new Date(),
//               paymentMethod: "razorpay",
//               paymentResult: {
//                 id: payment.id,
//                 status: "captured",
//                 update_time: new Date().toISOString(),
//                 email_address: "", // webhook me email nahi aata; optional
//               },
//             },
//             { new: true }
//           );
//         }
//       }
//     }

//     return res.status(200).json({ received: true });
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };
