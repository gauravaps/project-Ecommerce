import { BrowserRouter, Routes, Route } from "react-router-dom";
import PaymentPage from "./paymentPaypal/PaymentPage";
import SuccessPage from "./paymentPaypal/SuccessPage";
import CancelPage from "./paymentPaypal/CancelPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaymentPage />} />
        <Route path="/payment-success" element={<SuccessPage />} />
        <Route path="/payment-cancel" element={<CancelPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 
