import { useState } from "react";

function PaymentPage() {
  const [orderId, setOrderId] = useState("");
  const [approveUrl, setApproveUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleCapture = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/payments/capture-payment-paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      setMessage(JSON.stringify(data, null, 2));
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Manual PayPal Test</h2>

      <input
        type="text"
        placeholder="Paste PayPal Order ID here"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        style={{ padding: "8px", marginRight: "10px" }}
      />
      <button onClick={handleCapture} style={{ padding: "8px 15px" }}>
        Capture Payment
      </button>

      <br /><br />
      <input
        type="text"
        placeholder="Paste Approve URL here"
        value={approveUrl}
        onChange={(e) => setApproveUrl(e.target.value)}
        style={{ width: "400px", padding: "8px" }}
      />
      {approveUrl && (
        <p>
          <a href={approveUrl} target="_blank" rel="noreferrer">
            👉 Open Approve URL (PayPal)
          </a>
        </p>
      )}

      <pre style={{ marginTop: "20px", background: "#eee", padding: "15px" }}>
        {message}
      </pre>
    </div>
  );
}

export default PaymentPage;
