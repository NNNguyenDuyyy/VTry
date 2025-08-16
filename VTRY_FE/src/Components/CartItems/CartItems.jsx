import React, { useContext, useState, useEffect } from "react";
import "./CartItems.css";
import cross_icon from "../Assets/cart_cross_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";
import { usePayOS } from "@payos/payos-checkout";

const CartItems = () => {
  const { products, cartItems, removeFromCart, getTotalCartAmount } = useContext(ShopContext);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'payos'
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payOSConfig, setPayOSConfig] = useState({
    RETURN_URL: window.location.href,
    ELEMENT_ID: 'payos-embedded',
    CHECKOUT_URL: null,
    embedded: true,
    onSuccess: async (event) => {
      console.log('🎉 PayOS payment successful:', event);
      setPaymentModalVisible(false);
      // Reset CHECKOUT_URL to prevent duplicate iframes on reopen
      setPayOSConfig(prevConfig => ({
        ...prevConfig,
        CHECKOUT_URL: null
      }));
      try {
        const token = localStorage.getItem("auth-token");
        const response = await fetch(`${backend_url}/payos/confirm/${event.orderCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': token
          }
        });
        const data = await response.json();
        if (data.success) {
          alert('Payment successful! Your order has been confirmed.');
          window.location.href = '/orders';
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
      }
    },
    onExit: (event) => {
      console.log('🏃‍♂️ PayOS checkout exited:', event);
      setPaymentModalVisible(false);
      // Reset CHECKOUT_URL to prevent duplicate iframes on reopen
      setPayOSConfig(prevConfig => ({
        ...prevConfig,
        CHECKOUT_URL: null
      }));
    },
    onError: (error) => {
      console.error('❌ PayOS error:', error);
      alert('Payment error occurred. Please try again.');
    }
  });

  const { open, exit } = usePayOS(payOSConfig);

  const handleCODCheckout = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        alert("Please login first!");
        return;
      }

      const orderData = {
        cartItems: cartItems,
        amount: getTotalCartAmount(),
        address: "Default Address", // 👈 bạn có thể làm form nhập địa chỉ riêng
      };

      const res = await fetch(`${backend_url}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (data.success) {
        alert("Checkout successful!");
        window.location.href = "/orders"; // chuyển sang trang xem đơn hàng
      } else {
        alert(data.message || "Checkout failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout error!");
    }
  };

  const handlePayOSCheckout = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        alert("Please login first!");
        return;
      }

      setPayosLoading(true);
      setPaymentModalVisible(true);

      const orderData = {
        amount: getTotalCartAmount(),
        cartItems: cartItems,
        address: "Default Address"
      };

      const res = await fetch(`${backend_url}/payos/create-payment-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        console.log('✅ PayOS payment link created:', data.data.checkoutUrl);
        setPayOSConfig(prevConfig => ({
          ...prevConfig,
          CHECKOUT_URL: data.data.checkoutUrl
        }));
      } else {
        alert(data.message || "Failed to create payment link!");
        setPaymentModalVisible(false);
      }
    } catch (err) {
      console.error(err);
      alert("Payment creation error!");
      setPaymentModalVisible(false);
    } finally {
      setPayosLoading(false);
    }
  };

  const handleCheckout = () => {
    if (paymentMethod === 'cod') {
      handleCODCheckout();
    } else if (paymentMethod === 'payos') {
      handlePayOSCheckout();
    }
  };

  // Handle PayOS configuration changes
  useEffect(() => {
    if (payOSConfig.CHECKOUT_URL) {
      open();
    }
  }, [payOSConfig.CHECKOUT_URL, open]);

  return (
    <div className="cartitems">
      <div className="cartitems-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
      {products.map((e) => {
        if (cartItems[e.id] > 0) {
          return (
            <div key={e.id}>
              <div className="cartitems-format-main cartitems-format">
                <img className="cartitems-product-icon" src={backend_url + e.image} alt="" />
                <p className="cartitems-product-title">{e.name}</p>
                <p>{currency}{e.new_price}</p>
                <button className="cartitems-quantity">{cartItems[e.id]}</button>
                <p>{currency}{e.new_price * cartItems[e.id]}</p>
                <img onClick={() => { removeFromCart(e.id) }} className="cartitems-remove-icon" src={cross_icon} alt="" />
              </div>
              <hr />
            </div>
          );
        }
        return null;
      })}

      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>{currency}{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>{currency}{getTotalCartAmount()}</h3>
            </div>
          </div>
          <div className="payment-methods">
            <h3>Select Payment Method:</h3>
            <div className="payment-options">
              <label>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Cash on Delivery (COD)
              </label>
              <label>
                <input 
                  type="radio" 
                  name="payment" 
                  value="payos" 
                  checked={paymentMethod === 'payos'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Online Banking (PayOS)
              </label>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={payosLoading}>
            {payosLoading ? 'Creating Payment...' : 'PROCEED TO CHECKOUT'}
          </button>
        </div>
        <div className="cartitems-promocode">
          <p>If you have a promo code, Enter it here</p>
          <div className="cartitems-promobox">
            <input type="text" placeholder="promo code" />
            <button>Submit</button>
          </div>
        </div>
      </div>
      
      {/* PayOS Payment Modal */}
      {paymentModalVisible && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <div className="payment-modal-header">
              <h3>Complete Your Payment</h3>
              <button 
                className="close-modal" 
                onClick={() => {
                  setPaymentModalVisible(false);
                  exit();
                  // Reset CHECKOUT_URL to prevent duplicate iframes on reopen
                  setPayOSConfig(prevConfig => ({
                    ...prevConfig,
                    CHECKOUT_URL: null
                  }));
                }}
              >
                ×
              </button>
            </div>
            <div id="payos-embedded" className="payos-container"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItems;
