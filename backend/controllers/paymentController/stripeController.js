import Stripe from "stripe";
import PaymentModel from "../../models/PaymentModel.js";
import Order from "../../models/OrderModel.js";
 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: rupees -> paisa (Stripe works in smallest currency unit)
const toPaise = (amountInRupee) => Math.round(Number(amountInRupee) * 100);

// 1) Create Stripe PaymentIntent
export const createStripePaymentIntent = async (req, res) => {
  try {

    const { orderId } = req.body;
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

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toPaise(order.totalPrice),
      currency: "inr",
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    // Save/Update Payment record
    const payment = await PaymentModel.findOneAndUpdate(
      { order: order._id, user: req.user._id },
      {
        user: req.user._id,
        order: order._id,
        paymentMethod: "stripe",
        orderId: paymentIntent.id,
        amount: order.totalPrice,
        currency: "INR",
        status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      message: "Stripe PaymentIntent created",
      clientSecret: paymentIntent.client_secret, 
      paymentIntentId: paymentIntent.id,
      paymentRecordId: payment._id,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2) Confirm payment (for backend test via Postman)
export const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({ message: "paymentIntentId & orderId required" });
    }

    // Confirm PaymentIntent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa", // Stripe test card
    });

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not successful", paymentIntent });
    }

    // Update Payment record
    await PaymentModel.findOneAndUpdate(
      { order: orderId, stripe_payment_intent_id: paymentIntentId },
      {
        status: "completed",
        stripe_charge_id: paymentIntent.latest_charge,
      }
    );

    // Update Order as paid
    const paidOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        isPaid: true,
        paidAt: new Date(),
        paymentMethod: "stripe",
        paymentResult: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString(),
          email_address: req.user?.email || "",
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Stripe payment successful & order marked as paid",
      order: paidOrder,
      paymentIntent,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};







// 3) Create Checkout Session optional (frontend redirect to Stripe hosted page)
export const createStripeCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await Order.findById(orderId).populate("user", "email name");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure user owns the order
    if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed for this order" });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: order.user.email, 
      line_items: order.orderItems.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: { name: item.name },
          unit_amount: toPaise(item.price),
        },
        quantity: item.qty,
      })),
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    // Save Payment record (status = pending)
    await PaymentModel.findOneAndUpdate(
      { order: order._id, user: req.user._id },
      {
        user: req.user._id,
        order: order._id,
        paymentMethod: "stripe",
        orderId: session.id,
        amount: order.totalPrice,
        currency: "INR",
        status: "pending",
      },
      { upsert: true }
    );

    return res.status(200).json({
      message: "Checkout Session created",
      url: session.url, // frontend will redirect user here
      sessionId: session.id,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};