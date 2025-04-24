import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductHistory.css';

function ProductHistory({ account }) {
  const { hash } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      fetchProductDetails();
    }
  }, [hash]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Fetch basic product details
      const productResponse = await axios.get(`http://localhost:3001/api/products/${hash}`);
      setProduct(productResponse.data);
      
      // Fetch product history
      const historyResponse = await axios.get(`http://localhost:3001/api/products/${hash}/history`);
      setHistory(historyResponse.data.history);
    } catch (error) {
      console.error("Failed to fetch product details:", error);
      setError("Product not found or error fetching details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="product-history-page">
        <div className="loading-spinner">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-history-page">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-history-page">
        <div className="error-message">
          <h2>Product Not Found</h2>
          <p>The requested product could not be found.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-history-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      <div className="product-header">
        <h2>{product.productDetails.name}</h2>
        <span className={`status-badge ${product.isValid ? 'valid' : 'invalid'}`}>
          {product.isValid ? "Verified" : "Unverified"}
        </span>
      </div>

      <div className="product-info-card">
        <div className="product-details">
          <div className="detail-group">
            <h3>Product Details</h3>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{product.productDetails.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Batch Number:</span>
              <span className="value">{product.productDetails.batch}</span>
            </div>
            {product.productDetails.manufactureDate && (
              <div className="detail-row">
                <span className="label">Manufacture Date:</span>
                <span className="value">{product.productDetails.manufactureDate}</span>
              </div>
            )}
            {product.productDetails.expiryDate && (
              <div className="detail-row">
                <span className="label">Expiry Date:</span>
                <span className="value">{product.productDetails.expiryDate}</span>
              </div>
            )}
            {product.productDetails.details && (
              <div className="detail-row">
                <span className="label">Additional Details:</span>
                <span className="value">{product.productDetails.details}</span>
              </div>
            )}
          </div>

          <div className="detail-group">
            <h3>Blockchain Information</h3>
            <div className="detail-row">
              <span className="label">Product Hash:</span>
              <span className="value hash">{hash}</span>
            </div>
            <div className="detail-row">
              <span className="label">Current Owner:</span>
              <span className="value address">{product.owner}</span>
            </div>
            <div className="detail-row">
              <span className="label">Registration Date:</span>
              <span className="value">
                {new Date(product.additionTime * 1000).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="history-section">
        <h3>Product History</h3>
        {history.length === 0 ? (
          <p>No history records available.</p>
        ) : (
          <div className="timeline">
            {history.map((event, index) => (
              <div className="timeline-item" key={index}>
                <div className="timeline-point"></div>
                <div className="timeline-content">
                  <div className="timeline-date">
                    {new Date(event.timestamp * 1000).toLocaleString()}
                  </div>
                  <div className="timeline-body">
                    <h4>{event.type}</h4>
                    <div className="event-details">
                      {event.type === 'Registration' && (
                        <p>Product registered by <span className="address">{event.address}</span></p>
                      )}
                      {event.type === 'Ownership Transfer' && (
                        <p>Ownership transferred from <span className="address">{event.from}</span> to <span className="address">{event.to}</span></p>
                      )}
                      {event.type === 'Status Update' && (
                        <p>Verification status changed to <span className={event.status ? 'valid' : 'invalid'}>{event.status ? 'Verified' : 'Unverified'}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductHistory;