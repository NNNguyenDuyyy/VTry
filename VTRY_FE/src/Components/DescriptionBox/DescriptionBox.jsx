import React, { useState, useEffect, useCallback } from 'react';
import './DescriptionBox.css';
import { backend_url } from '../../App';

const DescriptionBox = ({ product }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(false);
  const fetchFeedbacks = useCallback(async () => {
    if (!product) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${backend_url}/feedback/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedback || data);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (product && activeTab === 'reviews') {
      fetchFeedbacks();
    }
  }, [product, activeTab, fetchFeedbacks]);

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="descriptionbox">
      <div className="descriptionbox-navigator">
        <div 
          className={`descriptionbox-nav-box ${activeTab === 'description' ? '' : 'fade'}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </div>
        <div 
          className={`descriptionbox-nav-box ${activeTab === 'reviews' ? '' : 'fade'}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({feedbacks.length})
        </div>
      </div>
      
      {activeTab === 'description' && (
        <div className="descriptionbox-description">
          <p>
            {product?.description || "An e-commerce website is an online platform that facilitates the buying and selling of products or services over the internet. It serves as a virtual marketplace where businesses and individuals can showcase their products, interact with customers, and conduct transactions without the need for a physical presence."}
          </p>
        </div>
      )}
      
      {activeTab === 'reviews' && (
        <div className="descriptionbox-description">
          {loading ? (
            <p>Loading reviews...</p>
          ) : feedbacks.length > 0 ? (
            <div className="reviews-container">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="review-item">
                    <div className="review-header">
                      <div className="review-rating">{renderStars(feedback.rating)}</div>
                      <div className="review-date">{formatDate(feedback.date)}</div>
                    </div>
                    <div className="review-user">By: {feedback.userName || 'Anonymous'}</div>
                    <div className="review-comment">{feedback.comment}</div>
                  </div>
              ))}
            </div>
          ) : (
            <p>No reviews yet. Be the first to review this product!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DescriptionBox;
