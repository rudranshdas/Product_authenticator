import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import axios from 'axios';
import './Customer.css';

const videoConstraints = {
  facingMode: 'environment',
  width: 640,
  height: 480
};

function Customer({ account }) {
  const [result, setResult] = useState('');
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualHash, setManualHash] = useState('');
  const [scanActive, setScanActive] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Function to stop the scanning process
  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanActive(false);
  };

  // Improved QR scanning with continuous capture
  const startScanning = useCallback(() => {
    if (scanActive) return;
    
    setScanActive(true);
    setError('');
    
    // Create a continuous scanning process
    scanIntervalRef.current = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const canvas = canvasRef.current;
        const video = webcamRef.current.video;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode) {
          console.log("QR Code detected:", qrCode.data);
          setResult(qrCode.data);
          stopScanning();
          verifyProduct(qrCode.data);
        }
      }
    }, 500); // Scan every 500ms
    
  }, [scanActive]);

  // Stop scanning on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualHash.trim()) {
      verifyProduct(manualHash.trim());
    }
  };

  // Improved verification with better error handling
  const verifyProduct = async (hash) => {
    setLoading(true);
    setError('');
    setProductData(null);
    
    try {
      console.log("Verifying hash:", hash);
      
      // Ensure the hash is in the correct format
      const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}`;
      
      // First verify the product
      const verifyResponse = await axios.post('http://localhost:3001/api/verify', { 
        hash: formattedHash 
      });
      
      console.log("Verification response:", verifyResponse.data);
      
      if (verifyResponse.data.isValid) {
        try {
          // Then fetch product details for valid products
          const detailsResponse = await axios.get(`http://localhost:3001/api/products/${formattedHash}`);
          console.log("Product details:", detailsResponse.data);
          setProductData(detailsResponse.data);
        } catch (detailsError) {
          console.error("Failed to fetch product details:", detailsError);
          
          // Create a fallback product if we can't get details
          setProductData({
            isValid: true,
            hash: formattedHash,
            additionTime: Math.floor(Date.now() / 1000),
            productDetails: {
              name: "Verified Product",
              batch: formattedHash.substring(2, 10),
              manufactureDate: "Unknown",
              details: "This product has been verified on the blockchain"
            }
          });
        }
      } else {
        setProductData({ isValid: false });
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setError(`Verification failed: ${error.response?.data?.error || error.message}`);
      setProductData({ isValid: false });
    } finally {
      setLoading(false);
    }
  };



  // Add tab switching functionality
  const [activeTab, setActiveTab] = useState('scan');
  
  return (
    <div className="customer-page">
      <div className="verification-container">
        <h2>Product Verification</h2>
        
        <div className="verification-tabs">
          <button 
            className={`tab-button ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            Scan QR Code
          </button>
          <button 
            className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Enter Hash
          </button>
        </div>
        
        <div className="tab-content">
          {/* QR Scanner Tab */}
          <div className="scanner-container" style={{ display: activeTab === 'scan' ? 'block' : 'none' }}>
            <div className="webcam-wrapper">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="webcam-feed"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <div className="scanner-overlay">
                <div className="scanner-frame"></div>
              </div>
            </div>
            
            <button 
              className="scan-btn" 
              onClick={scanActive ? stopScanning : startScanning} 
              disabled={loading}
            >
              {loading ? "Processing..." : scanActive ? "Stop Scanning" : "Start Scanning"}
            </button>
            
            {error && <p className="error-message">{error}</p>}
          </div>

          {/* Manual Hash Entry Tab */}
          <div className="manual-hash-container" style={{ display: activeTab === 'manual' ? 'block' : 'none' }}>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Enter Product Hash:</label>
                <input 
                  type="text"
                  value={manualHash}
                  onChange={(e) => setManualHash(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify Product"}
              </button>
            </form>
          </div>
        </div>

        {/* Verification Result */}
        {productData && (
          <div className={`verification-result ${productData.isValid ? 'valid' : 'invalid'}`}>
            {productData.isValid ? (
              <>
                <div className="result-header">
                  <h3>✅ Genuine Product</h3>
                  <span className="verified-badge">Blockchain Verified</span>
                </div>
                
                <div className="product-details">
                  <h4>Product Information</h4>
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">{productData.productDetails.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Batch:</span>
                    <span className="value">{productData.productDetails.batch}</span>
                  </div>
                  {productData.productDetails.manufactureDate && (
                    <div className="detail-row">
                      <span className="label">Manufactured:</span>
                      <span className="value">{productData.productDetails.manufactureDate}</span>
                    </div>
                  )}
                  {productData.productDetails.expiryDate && (
                    <div className="detail-row">
                      <span className="label">Expires:</span>
                      <span className="value">{productData.productDetails.expiryDate}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Registered:</span>
                    <span className="value">
                      {new Date(productData.additionTime * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
              </>
            ) : (
              <div className="result-header invalid">
                <h3>❌ Counterfeit Alert</h3>
                <p>This product cannot be verified on our blockchain.</p>
              </div>
            )}
          </div>
        )}

        {result && !productData && !loading && (
          <p className="scan-result">Scanned: <span>{result}</span></p>
        )}
      </div>
    </div>
  );
}

export default Customer;