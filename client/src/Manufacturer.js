import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Manufacturer.css';

function Manufacturer({ account, userRole }) {
  const [product, setProduct] = useState({
    name: '',
    batch: '',
    manufactureDate: '',
    expiryDate: '',
    details: ''
  });
  const [qrCode, setQrCode] = useState('');
  const [hash, setHash] = useState('');
  const [products, setProducts] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkProducts, setBulkProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (account) {
      fetchUserProducts();
    }
  }, [account]);

  const fetchUserProducts = async () => {
    if (!account) return;
    try {
      const response = await axios.get(`http://localhost:3001/api/products/user/${account}`);
      setProducts(response.data.products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/products', {
        productDetails: product,
        manufacturerAddress: account
      });
      setHash(response.data.hash);
      setQrCode(response.data.qrCode);
      fetchUserProducts(); // Refresh the product list
    } catch (error) {
      if (error.response?.status === 403) {
        alert("Error: You don't have permission to register products. Contact an admin for access.");
      } else {
        alert("Registration failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBulkFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const products = JSON.parse(event.target.result);
          setBulkProducts(products);
        } catch (error) {
          alert("Invalid JSON file. Please upload a valid JSON array of products.");
          setBulkFile(null);
          setBulkProducts([]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!bulkProducts.length) {
      alert("Please upload a valid JSON file first.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/products/bulk', {
        products: bulkProducts,
        manufacturerAddress: account
      });
      alert(`Successfully registered ${response.data.count} products!`);
      fetchUserProducts(); // Refresh the product list
      setBulkFile(null);
      setBulkProducts([]);
    } catch (error) {
      if (error.response?.status === 403) {
        alert("Error: You don't have permission to register products. Contact an admin for access.");
      } else {
        alert("Bulk registration failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !transferAddress) {
      alert("Please select a product and enter a valid address.");
      return;
    }

    try {
      await axios.post('http://localhost:3001/api/products/transfer', {
        productHash: selectedProduct,
        currentOwner: account,
        newOwner: transferAddress
      });
      alert("Ownership transferred successfully!");
      setSelectedProduct(null);
      setTransferAddress('');
      fetchUserProducts(); // Refresh the product list
    } catch (error) {
      alert("Transfer failed: " + error.response?.data?.error || error.message);
    }
  };

  if (!account) {
    return (
      <div className="manufacturer-page">
        <div className="info-message">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your MetaMask wallet to access manufacturer features.</p>
        </div>
      </div>
    );
  }

  if (userRole !== 0 && userRole !== 1) {
    return (
      <div className="manufacturer-page">
        <div className="info-message">
          <h2>Access Restricted</h2>
          <p>You need Admin or Manager role to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manufacturer-page">
      <div className="manufacturer-tabs">
        <div className="tab-buttons">
          <button className="tab-button active">Register Product</button>

        </div>

        <div className="tab-content">
          {/* Register Single Product Form */}
          <div className="manufacturer-form">
            <h2>Register Product</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name:</label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Batch Number:</label>
                <input
                  type="text"
                  value={product.batch}
                  onChange={(e) => setProduct({ ...product, batch: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Manufacture Date:</label>
                <input
                  type="date"
                  value={product.manufactureDate}
                  onChange={(e) => setProduct({ ...product, manufactureDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Expiry Date:</label>
                <input
                  type="date"
                  value={product.expiryDate}
                  onChange={(e) => setProduct({ ...product, expiryDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Additional Details:</label>
                <textarea
                  value={product.details}
                  onChange={(e) => setProduct({ ...product, details: e.target.value })}
                  rows="4"
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register Product"}
              </button>
            </form>

            {qrCode && (
              <div className="qr-result">
                <h3>Product Registered Successfully!</h3>
                <img src={qrCode} alt="Product QR Code" />
                <p>Product Hash: <span className="hash">{hash}</span></p>
                <button onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCode;
                  link.download = `product_${product.name}_${product.batch}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}>
                  Download QR Code
                </button>
              </div>
            )}
          </div>

          {/* Bulk Register Form */}
          <div className="bulk-register-form" style={{ display: 'none' }}>
            <h2>Bulk Register Products</h2>
            <div className="form-group">
              <label>Upload JSON File:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleBulkFileChange}
              />
              <p className="helper-text">
                File should contain an array of product objects.
              </p>
            </div>

            {bulkProducts.length > 0 && (
              <div className="bulk-preview">
                <h3>Preview: {bulkProducts.length} Products</h3>
                <ul>
                  {bulkProducts.slice(0, 5).map((prod, index) => (
                    <li key={index}>
                      {prod.name} - Batch: {prod.batch}
                    </li>
                  ))}
                  {bulkProducts.length > 5 && <li>...and {bulkProducts.length - 5} more</li>}
                </ul>
                <button onClick={handleBulkUpload} disabled={loading}>
                  {loading ? "Processing..." : "Register All Products"}
                </button>
              </div>
            )}
          </div>

          {/* My Products Tab */}
          <div className="my-products" style={{ display: 'none' }}>
            <h2>My Registered Products</h2>
            {products.length === 0 ? (
              <p>You haven't registered any products yet.</p>
            ) : (
              <div className="products-list">
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Batch</th>
                      <th>Registration Date</th>
                      <th>Hash</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod, index) => (
                      <tr key={index}>
                        <td>{prod.productDetails.name}</td>
                        <td>{prod.productDetails.batch}</td>
                        <td>{new Date(prod.additionTime * 1000).toLocaleDateString()}</td>
                        <td className="hash-cell">{prod.hash.substring(0, 10)}...</td>
                        <td>
                          <button onClick={() => window.location.href = `/product/${prod.hash}`}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transfer Ownership Tab */}
          <div className="transfer-ownership" style={{ display: 'none' }}>
            <h2>Transfer Product Ownership</h2>
            <form onSubmit={handleTransferOwnership}>
              <div className="form-group">
                <label>Select Product:</label>
                <select
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                >
                  <option value="">-- Select a product --</option>
                  {products.map((prod, index) => (
                    <option key={index} value={prod.hash}>
                      {prod.productDetails.name} - Batch: {prod.productDetails.batch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>New Owner Address:</label>
                <input
                  type="text"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>

              <button type="submit">Transfer Ownership</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Manufacturer;