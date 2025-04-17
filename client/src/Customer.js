import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import axios from 'axios';
import './Customer.css'; // make sure to create and import this

const videoConstraints = {
  facingMode: 'environment',
  width: 640,
  height: 480
};

function Customer() {
  const [result, setResult] = useState('');
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const capture = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (qrCode) {
      setResult(qrCode.data);
      verifyProduct(qrCode.data);
    }
  }, []);

  const verifyProduct = async (hash) => {
    try {
      const response = await axios.post('http://localhost:3001/api/verify', { hash });
      alert(response.data.isValid ? "✅ Genuine Product" : "❌ Counterfeit");
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  return (
    <div className="scanner-container">
      <h2 className="scanner-heading">Verify Product</h2>
      <div className="webcam-wrapper">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam-feed"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <button className="scan-btn" onClick={capture}>Scan QR Code</button>
      {result && <p className="scan-result">Scanned: <span>{result}</span></p>}
    </div>
  );
}

export default Customer;
