import Order from "../models/OrderModel";


//this is used in razorpay paypal and stripe payment success callback no need to create a separate route for this
//now only we have razorpay payment gateway thats why we used attached order update logic 
// but when we will add more payment gateways we can use this helper function in their success callback also 

 export const markOrderPaid = async (orderId, method, result) => {
  return await Order.findByIdAndUpdate(orderId, {
    isPaid: true,
    paidAt: Date.now(),
    paymentMethod: method,
    paymentResult: result
  }, { new: true });
};
