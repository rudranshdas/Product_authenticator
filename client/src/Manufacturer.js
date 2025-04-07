import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';

function Manufacturer() {
  const [product, setProduct] = useState({
    name: '',
    batch: '',
    manufactureDate: '',
    expiryDate: ''
  });
  const [qrCode, setQrCode] = useState('');
  const [hash, setHash] = useState('');
  const [manufacturerAddress, setManufacturerAddress] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setManufacturerAddress(accounts[0]);
      } catch (error) {
        console.error("User denied access:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manufacturerAddress) {
      alert("Connect MetaMask first!");
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/products', {
        productDetails: product,
        manufacturerAddress
      });
      setHash(response.data.hash);
      setQrCode(response.data.qrCode);
    } catch (error) {
        if (error.response?.status === 403) {
            alert("Error: Your wallet is not the contract owner. Connect the correct address.");
          } else {
            alert("Registration failed: " + error.message);
          }
    }
  };

  return (
    <div className="manufacturer-container">
      <h2>Register Product</h2>
      <button onClick={connectWallet}>
        {manufacturerAddress ? 
          `Connected: ${manufacturerAddress.slice(0, 6)}...` : 
          "Connect MetaMask"}
      </button>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product Name"
          value={product.name}
          onChange={(e) => setProduct({...product, name: e.target.value})}
          required
        />
        <input
            type="text"
            placeholder="Batch Number"
            value={product.batch}
            onChange={(e) => setProduct({...product, batch: e.target.value})}
            required
        />
        {/* Add other form fields */}
        <button type="submit">Register Product</button>
      </form>

      {qrCode && (
        <div className="qr-result">
          <img src={qrCode} alt="Product QR Code" />
          <p>Product Hash: {hash}</p>
        </div>
      )}
    </div>
  );
}

export default Manufacturer;



























