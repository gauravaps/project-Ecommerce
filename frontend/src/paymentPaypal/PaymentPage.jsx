import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

function PaymentPage() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Test PayPal Payment</h2>
      <PayPalScriptProvider options={{ "client-id": "test" }}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: { value: "10.00" }, // dummy amount
                },
              ],
              application_context: {
                return_url: "http://localhost:5173/payment-success",
                cancel_url: "http://localhost:5173/payment-cancel",
              },
            });
          }}
          onApprove={(data, actions) => {
            return actions.order.capture().then((details) => {
              alert("Payment Successful by " + details.payer.name.given_name);
            });
          }}
          onCancel={() => {
            alert("Payment Cancelled!");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}

export default PaymentPage;
