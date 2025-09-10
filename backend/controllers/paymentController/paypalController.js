import fetch from "node-fetch";
import Order from "../../models/OrderModel.js";
import PaymentModel from "../../models/PaymentModel.js";


// PayPal credentials
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // sandbox / live
const PAYPAL_BASE = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// 🔹 Helper: Get PayPal Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || "Failed to get PayPal token");
  }
  return data.access_token;
}
 
// 1️⃣ Create PayPal Order
export const createPaypalOrder = async (req, res) => {
  try {
    const { orderId } = req.body; // DB Order _id
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await Order.findById(orderId).populate("user", "email name");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed for this order" });
    }

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order._id.toString(),
            amount: {
              currency_code: process.env.PAYPAL_CURRENCY || "USD",
              value: order.totalPrice.toFixed(2),
            },
          }, 
        ],
        application_context: {
          brand_name: "furnitureMart",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: "http://localhost:5000/api/payments/paypal/capture", 
          cancel_url: "http://localhost:5000/api/payments/paypal/cancel",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ message: data.message || "Failed to create PayPal order" });
    }

    // Save payment record
    await PaymentModel.findOneAndUpdate(
      { order: order._id, user: req.user._id },
      {
        user: req.user._id,
        order: order._id,
        paymentMethod: "paypal",
        orderId: data.id,
        amount: order.totalPrice,
        currency: process.env.PAYPAL_CURRENCY || "USD",
        status: "created",
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      message: "PayPal order created",
      paypalOrderId: data.id,
      links: data.links, 
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2️⃣ Capture PayPal Payment
export const capturePaypalPayment = async (req, res) => {
  try {
    const { orderId } = req.body; // PayPal orderId (not DB order _id)
    if (!orderId) return res.status(400).json({ message: "paypal orderId is required" });

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ message: data.message || "Failed to capture PayPal payment" });
    }

    const transaction = data.purchase_units[0].payments.captures[0];

    // Update Payment record
    const payment = await PaymentModel.findOneAndUpdate(
      { orderId: orderId, user: req.user._id },
      {
        status: "completed",
        paypal_payment_id: transaction.id,
      },
      { new: true }
    );

    // Update Order -> mark as paid
    const dbOrderId = data.purchase_units[0].reference_id;
    const paidOrder = await Order.findByIdAndUpdate(
      dbOrderId,
      {
        isPaid: true,
        paidAt: new Date(),
        paymentMethod: "paypal",
        paymentResult: {
          id: transaction.id,
          status: transaction.status,
          update_time: transaction.update_time,
          email_address: data.payer.email_address,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Payment captured & order marked as paid",
      order: paidOrder,
      payment,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
