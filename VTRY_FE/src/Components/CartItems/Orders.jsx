import React, { useEffect, useState, useContext } from "react";
import { backend_url, currency } from "../../App";
import { ShopContext } from "../../Context/ShopContext";
import "./CartItems.css";

// Feedback Modal Component
const FeedbackModal = ({ isOpen, onClose, product, orderId, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            alert("Please enter a comment");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onSubmit({
                productId: product.id,
                orderId,
                rating,
                comment: comment.trim()
            });
            setRating(5);
            setComment("");
            onClose();
        } catch (error) {
            console.error("Feedback submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarRating = () => {
        return (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        style={{
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: (hoveredStar || rating) >= star ? '#ffc107' : '#e4e5e9',
                            transition: 'color 0.2s ease',
                            userSelect: 'none'
                        }}
                    >
                        ★
                    </span>
                ))}
                <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
                    {rating === 1 && 'Terrible'}
                    {rating === 2 && 'Poor'}
                    {rating === 3 && 'Average'}
                    {rating === 4 && 'Good'}
                    {rating === 5 && 'Excellent'}
                </span>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div 
            className="modal-overlay" 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.3s ease-out'
            }}
        >
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    padding: '32px',
                    borderRadius: '16px',
                    width: '90%',
                    maxWidth: '520px',
                    maxHeight: '85vh',
                    overflow: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    animation: 'slideUp 0.3s ease-out',
                    position: 'relative'
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#999',
                        padding: '4px',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f5f5f5';
                        e.target.style.color = '#333';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#999';
                    }}
                >
                    ×
                </button>

                {/* Header */}
                <div style={{ marginBottom: '24px', paddingRight: '40px' }}>
                    <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#333',
                        lineHeight: '1.3'
                    }}>
                        Share Your Experience
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '16px',
                        color: '#666',
                        fontWeight: '500'
                    }}>
                        {product.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Rating Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            How would you rate this product?
                        </label>
                        <StarRating />
                    </div>

                    {/* Comment Section */}
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Tell us about your experience
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What did you like or dislike about this product? Your feedback helps other customers make informed decisions..."
                            rows={5}
                            style={{
                                width: '100%',
                                padding: '16px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '12px',
                                fontSize: '15px',
                                lineHeight: '1.5',
                                resize: 'vertical',
                                minHeight: '120px',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#007bff'}
                            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                            required
                        />
                        <div style={{
                            fontSize: '13px',
                            color: '#999',
                            marginTop: '8px',
                            textAlign: 'right'
                        }}>
                            {comment.length}/500 characters
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        justifyContent: 'flex-end',
                        paddingTop: '16px',
                        borderTop: '1px solid #f0f0f0'
                    }}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                border: '2px solid #e1e5e9',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '500',
                                color: '#666',
                                transition: 'all 0.2s ease',
                                minWidth: '100px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = '#ccc';
                                e.target.style.backgroundColor = '#f8f9fa';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = '#e1e5e9';
                                e.target.style.backgroundColor = 'white';
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !comment.trim()}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                backgroundColor: isSubmitting || !comment.trim() ? '#ccc' : '#007bff',
                                color: 'white',
                                borderRadius: '8px',
                                cursor: isSubmitting || !comment.trim() ? 'not-allowed' : 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                minWidth: '140px',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting && comment.trim()) {
                                    e.target.style.backgroundColor = '#0056b3';
                                    e.target.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting && comment.trim()) {
                                    e.target.style.backgroundColor = '#007bff';
                                    e.target.style.transform = 'translateY(0)';
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid transparent',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></span>
                                    Submitting...
                                </span>
                            ) : 'Submit Review'}
                        </button>
                    </div>
                </form>

                {/* Add CSS animations */}
                <style jsx>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { 
                            opacity: 0;
                            transform: translateY(30px) scale(0.95);
                        }
                        to { 
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const { products: ctxProducts } = useContext(ShopContext);
    const [products, setProducts] = useState(ctxProducts || []);
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, product: null, orderId: null });
    const [userFeedbacks, setUserFeedbacks] = useState([]);

    // Nếu ShopContext có products thì dùng, nếu không bạn có thể fetch /allproducts nếu muốn.
    useEffect(() => {
        if (ctxProducts && ctxProducts.length > 0) setProducts(ctxProducts);
    }, [ctxProducts]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem("auth-token");
                if (!token) {
                    alert("Please login first!");
                    return;
                }

                const res = await fetch(`${backend_url}/myorders`, {
                    headers: { "auth-token": token },
                });
                const data = await res.json();
                if (data.success) {
                    setOrders(data.orders);
                } else {
                    alert(data.message || "Failed to load orders");
                }
            } catch (err) {
                console.error("fetchOrders error:", err);
            }
        };

        const fetchUserFeedbacks = async () => {
            try {
                const token = localStorage.getItem("auth-token");
                if (!token) return;

                const res = await fetch(`${backend_url}/myfeedback`, {
                    headers: { "auth-token": token },
                });
                const data = await res.json();
                if (data.success) {
                    setUserFeedbacks(data.feedback);
                }
            } catch (err) {
                console.error("fetchUserFeedbacks error:", err);
            }
        };

        fetchOrders();
        fetchUserFeedbacks();
    }, []);

    const handleFeedbackSubmit = async (feedbackData) => {
        try {
            const token = localStorage.getItem("auth-token");
            if (!token) {
                alert("Please login first!");
                return;
            }

            const res = await fetch(`${backend_url}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': token
                },
                body: JSON.stringify(feedbackData)
            });

            const data = await res.json();
            if (data.success) {
                alert("Feedback submitted successfully!");
                // Refresh user feedbacks
                const feedbackRes = await fetch(`${backend_url}/myfeedback`, {
                    headers: { "auth-token": token },
                });
                const feedbackData = await feedbackRes.json();
                if (feedbackData.success) {
                    setUserFeedbacks(feedbackData.feedback);
                }
            } else {
                alert(data.message || "Failed to submit feedback");
            }
        } catch (err) {
            console.error("handleFeedbackSubmit error:", err);
            alert("Failed to submit feedback");
        }
    };

    const openFeedbackModal = (product, orderId) => {
        setFeedbackModal({ isOpen: true, product, orderId });
    };

    const closeFeedbackModal = () => {
        setFeedbackModal({ isOpen: false, product: null, orderId: null });
    };

    const hasUserFeedback = (productId, orderId) => {
        return userFeedbacks.some(feedback => 
            String(feedback.productId) === String(productId) && 
            String(feedback.orderId) === String(orderId)
        );
    };

    // Chuyển order.items (object hoặc array) => array chuẩn [{id,name,image,price,quantity},...]
    const normalizeItems = (orderItems) => {
        if (!orderItems) return [];

        // Nếu backend đã trả mảng (đã lưu item objects), dùng luôn
        if (Array.isArray(orderItems)) {
            return orderItems.map(it => ({
                id: it.id ?? it.productId ?? it._id ?? "",
                name: it.name ?? it.title ?? `Product ${it.id ?? ""}`,
                image: it.image ?? "",
                price: it.price ?? it.new_price ?? 0,
                quantity: it.quantity ?? it.qty ?? 1,
            }));
        }

        // Nếu backend trả object { productId: qty, ... }
        if (typeof orderItems === "object") {
            return Object.entries(orderItems)
                .filter(([id, qty]) => Number(qty) > 0)
                .map(([id, qty]) => {
                    const prod = products.find(
                        p =>
                            String(p.id) === String(id) ||
                            String(p._id) === String(id)
                    );

                    return {
                        id,
                        name: prod ? prod.name : `Product ${id}`,
                        image: prod ? prod.image : "",
                        price: prod ? prod.new_price : 0,
                        quantity: Number(qty),
                    };
                });
        }

        return [];
    };

    if (orders.length === 0) {
        return (
            <div className="cartitems" style={{ textAlign: "center", padding: 20 }}>
                <h2>My Orders</h2>
                <p>No orders found.</p>
            </div>
        );
    }

    return (
        <div className="cartitems">
            <h2 style={{ marginBottom: 20 }}>My Orders</h2>

            {orders.map((order) => {
                const items = normalizeItems(order.items);

                return (
                    <div key={order._id} style={{ marginBottom: 40 }}>
                        <div className="cartitems-format-main" style={{ background: "#f7f7f7" }}>
                            <p>Products</p>
                            <p>Title</p>
                            <p>Price</p>
                            <p>Quantity</p>
                            <p>Total</p>
                            <p>Status</p>
                        </div>
                        <hr />

                        {items.length === 0 && (
                            <div style={{ padding: 12 }}>
                                <p>No items in this order (maybe products were removed).</p>
                            </div>
                        )}

                        {items.map((item, idx) => (
                            <div key={idx}>
                                <div className="cartitems-format-main cartitems-format">
                                    <img
                                        className="cartitems-product-icon"
                                        src={item.image ? backend_url + item.image : `${backend_url}/images/placeholder.png`}
                                        alt={item.name}
                                    />
                                    <p className="cartitems-product-title">{item.name}</p>
                                    <p>{currency}{item.price}</p>
                                    <button className="cartitems-quantity">{item.quantity}</button>
                                    <p>{currency}{item.price * item.quantity}</p>

                                    {idx === 0 && (
                                        <div
                                            style={{
                                                gridRow: `span ${items.length}`,
                                                alignSelf: "center",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "10px"
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontWeight: "bold",
                                                    color: order.status === "Delivered" ? "green" : "orange",
                                                    margin: 0
                                                }}
                                            >
                                                {order.status ?? (order.isPaid ? "Paid" : "Processing")}
                                            </p>
                                            {(order.status === "Delivered" || order.isPaid) && (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                                    {items.map((feedbackItem) => (
                                                        <div key={`feedback-${feedbackItem.id}`}>
                                                            {hasUserFeedback(feedbackItem.id, order._id) ? (
                                                                <span style={{ 
                                                                    fontSize: "12px", 
                                                                    color: "green",
                                                                    fontWeight: "bold"
                                                                }}>
                                                                    ✓ Reviewed
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openFeedbackModal(feedbackItem, order._id)}
                                                                    style={{
                                                                        padding: "4px 8px",
                                                                        fontSize: "12px",
                                                                        backgroundColor: "#007bff",
                                                                        color: "white",
                                                                        border: "none",
                                                                        borderRadius: "4px",
                                                                        cursor: "pointer",
                                                                        width: "100%"
                                                                    }}
                                                                >
                                                                    Review {feedbackItem.name.length > 15 ? feedbackItem.name.substring(0, 15) + '...' : feedbackItem.name}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <hr />
                            </div>
                        ))}

                        <div style={{ textAlign: "right", fontSize: 14, color: "#555" }}>
                            <p><strong>Order Date:</strong> {new Date(order.date).toLocaleString()}</p>
                            <p><strong>Order Total:</strong> {currency}{order.amount}</p>
                        </div>
                    </div>
                );
            })}
            
            <FeedbackModal
                isOpen={feedbackModal.isOpen}
                onClose={closeFeedbackModal}
                product={feedbackModal.product}
                orderId={feedbackModal.orderId}
                onSubmit={handleFeedbackSubmit}
            />
        </div>
    );
};

export default Orders;
