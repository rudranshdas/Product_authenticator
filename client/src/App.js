import React, { useState, useEffect } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Manufacturer from './Manufacturer';
import Customer from './Customer';
import Admin from './Admin';
import ProductHistory from './ProductHistory';
import './App.css';

function App() {
  const [account, setAccount] = useState('');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if MetaMask is installed
    if (!window.ethereum && !window.ethereum?.isMetaMask) {
      const onboarding = new MetaMaskOnboarding();
      onboarding.startOnboarding();
    } else {
      // Try to connect to previously connected account
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await checkUserRole(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        await checkUserRole(accounts[0]);
      } catch (error) {
        console.error("User denied account access:", error);
      }
    }
  };

  const checkUserRole = async (address) => {
    try {
      const response = await fetch(`http://localhost:3001/api/user/role?address=${address}`);
      const data = await response.json();
      setUserRole(data.role);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setUserRole(null);
  };

  return (
    <Router>
      <div className="app-background">
        <header className="app-header">
          <h1>Product Authenticator</h1>
          <div className="wallet-connection">
            {!account ? (
              <button onClick={connectWallet} className="connect-wallet-btn">
                Connect MetaMask
              </button>
            ) : (
              <div className="wallet-info">
                <span>
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
                <span className="role-badge">
                  {userRole === 0 ? "Admin" : userRole === 1 ? "Manager" : "User"}
                </span>
                <button onClick={disconnectWallet} className="disconnect-btn">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <NavigationButton path="/" label="Home" />
          <NavigationButton path="/customer" label="Verify Product" />
          {account && (userRole === 0 || userRole === 1) && (
            <NavigationButton path="/manufacturer" label="Register Products" />
          )}
          {account && userRole === 0 && (
            <NavigationButton path="/admin" label="Admin Dashboard" />
          )}
        </nav>

        <div className="container">
          <Routes>
            <Route 
              path="/manufacturer" 
              element={<Manufacturer account={account} userRole={userRole} />} 
            />
            <Route 
              path="/customer" 
              element={<Customer account={account} />} 
            />
            <Route 
              path="/admin" 
              element={<Admin account={account} userRole={userRole} />} 
            />
            <Route 
              path="/product/:hash" 
              element={<ProductHistory account={account} />} 
            />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function NavigationButton({ path, label }) {
  const navigate = useNavigate();
  return (
    <button className="nav-button" onClick={() => navigate(path)}>
      {label}
    </button>
  );
}

function Home() {
  return (
    <div className="home-container">
      <h2>Welcome to the Product Authenticator</h2>
      <p>A blockchain-based solution for product authentication and anti-counterfeiting.</p>
      
      <div className="feature-cards">
        <div className="feature-card">
          <h3>For Customers</h3>
          <p>Verify product authenticity by scanning QR codes.</p>
          <p>View product history and ownership information.</p>
        </div>
        
        <div className="feature-card">
          <h3>For Manufacturers</h3>
          <p>Register your products on the blockchain.</p>
          <p>Manage product ownership and verification status.</p>
        </div>
        
        <div className="feature-card">
          <h3>For Administrators</h3>
          <p>Manage user roles and permissions.</p>
          <p>Control the product authentication system.</p>
        </div>
      </div>
    </div>
  );
}

export default App;