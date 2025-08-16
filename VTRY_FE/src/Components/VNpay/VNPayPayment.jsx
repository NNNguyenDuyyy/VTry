import React, { useState } from "react";
import axios from "axios";
import { backend_url } from "../../App";

export default function VNPayPayment() {
    const [amount, setAmount] = useState(10000);

    const handlePayment = async () => {
        try {
            const res = await axios.post(`${backend_url}/vnpay/create-payment-url`, {
                amount
            });
            if (res.data?.paymentUrl) {
                window.location.href = res.data.paymentUrl; 
            } else {
                alert("Không lấy được link thanh toán");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tạo thanh toán");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Thanh toán VNPay</h2>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền"
            />
            <button onClick={handlePayment} style={{ marginLeft: "10px" }}>
                Thanh toán
            </button>
        </div>
    );
}
