import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

function Admin({ account, userRole }) {
  const [users, setUsers] = useState([]);
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserRole, setNewUserRole] = useState(2); // Default to User role
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    adminCount: 0,
    managerCount: 0,
    userCount: 0
  });

  useEffect(() => {
    if (account && userRole === 0) { // Check if admin
      fetchUsers();
      fetchAllProducts();
      fetchStats();
    }
  }, [account, userRole]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/products');
      setProducts(response.data.products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const assignRole = async (e) => {
    e.preventDefault();
    if (!newUserAddress) return;

    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/users/role', {
        adminAddress: account,
        userAddress: newUserAddress,
        role: parseInt(newUserRole)
      });
      alert("Role assigned successfully!");
      setNewUserAddress('');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      alert("Failed to assign role: " + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (hash) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to remove this product? This action cannot be undone.")) {
        return;
      }

    try {
      await axios.delete(`http://localhost:3001/api/products/${hash}`, {
        data: { adminAddress: account }
      });
      alert("Product removed successfully!");
      fetchAllProducts(); // Refresh the product list
      fetchStats(); // Update stats
    } catch (error) {
      alert("Failed to remove product: " + error.response?.data?.error || error.message);
    }
  };

  const updateVerificationStatus = async (hash, status) => {
    try {
      await axios.put(`http://localhost:3001/api/products/status`, {
        adminAddress: account,
        hash,
        status
      });
      alert(`Product status updated to ${status ? 'verified' : 'unverified'}!`);
      fetchAllProducts(); // Refresh the product list
    } catch (error) {
      alert("Failed to update status: " + error.response?.data?.error || error.message);
    }
  };

  if (!account) {
    return (
      <div className="admin-page">
        <div className="info-message">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your MetaMask wallet to access admin features.</p>
        </div>
      </div>
    );
  }

  if (userRole !== 0) {
    return (
      <div className="admin-page">
        <div className="info-message">
          <h2>Access Restricted</h2>
          <p>You need Admin role to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2>Admin Dashboard</h2>
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Products</h3>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
        <div className="stat-card">
          <h3>Admin Users</h3>
          <div className="stat-value">{stats.adminCount}</div>
        </div>
        <div className="stat-card">
          <h3>Manager Users</h3>
          <div className="stat-value">{stats.managerCount}</div>
        </div>
        <div className="stat-card">
          <h3>Regular Users</h3>
          <div className="stat-value">{stats.userCount}</div>
        </div>
      </div>

      <div className="admin-tabs">
        <div className="tab-buttons">
          
        </div>

        <div className="tab-content">
          {/* User Management Tab */}
          <div className="user-management">
            <div className="role-assignment-form">
              <h3>Assign User Role</h3>
              <form onSubmit={assignRole}>
                <div className="form-group">
                  <label>User Address:</label>
                  <input
                    type="text"
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Role:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                  >
                    <option value={0}>Admin</option>
                    <option value={1}>Manager</option>
                    <option value={2}>User</option>
                  </select>
                </div>
                
                <button type="submit" disabled={loading}>
                  {loading ? "Assigning..." : "Assign Role"}
                </button>
              </form>
            </div>

            <div className="users-list">
              <h3>User List</h3>
              {users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={index}>
                        <td className="address-cell">{user.address}</td>
                        <td>
                          {user.role === 0 ? "Admin" : user.role === 1 ? "Manager" : "User"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => {
                                setNewUserAddress(user.address);
                                setNewUserRole(user.role === 0 ? 2 : 0); // Toggle between Admin and User
                              }}
                              className="edit-btn"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Product Management Tab */}
          <div className="product-management" style={{ display: 'none' }}>
            <h3>Product List</h3>
            {products.length === 0 ? (
              <p>No products registered yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Owner</th>
                    <th>Added</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td>
                        <div className="product-cell">
                          <span className="product-name">{product.productDetails.name}</span>
                          <span className="product-batch">Batch: {product.productDetails.batch}</span>
                        </div>
                      </td>
                      <td className="address-cell">{product.owner.substring(0, 10)}...</td>
                      <td>{new Date(product.additionTime * 1000).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${product.isValid ? 'valid' : 'invalid'}`}>
                          {product.isValid ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => updateVerificationStatus(product.hash, !product.isValid)}
                            className="toggle-btn"
                          >
                            {product.isValid ? "Unverify" : "Verify"}
                          </button>
                          <button 
                            onClick={() => handleRemoveProduct(product.hash)}
                            className="remove-btn"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;