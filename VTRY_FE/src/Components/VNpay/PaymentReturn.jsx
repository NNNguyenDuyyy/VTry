import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { backend_url } from "../../App";

export default function PaymentReturn() {
    const location = useLocation();
    const [status, setStatus] = useState("Đang xử lý...");

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const params = {};
        for (let [key, value] of query.entries()) {
            params[key] = value;
        }

        axios
            .get(`${backend_url}/vnpay/vnpay_ipn`, { params })
            .then((res) => {
            if (res.data?.RspCode === "00") {
                setStatus("Thanh toán thành công!");
            } else {
                setStatus("Thanh toán thất bại hoặc bị hủy.");
            }
            })
            .catch(() => setStatus("Có lỗi khi xác thực giao dịch"));
    }, [location.search]);

    return (
        <div style={{ padding: "20px" }}>
            <h2>Kết quả thanh toán</h2>
            <p>{status}</p>
        </div>
    );
}
