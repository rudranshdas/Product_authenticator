import React, { useEffect } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Manufacturer from './Manufacturer';
import Customer from './Customer';
import './App.css';

function App() {
  useEffect(() => {
    if (!window.ethereum && !window.ethereum?.isMetaMask) {
      const onboarding = new MetaMaskOnboarding();
      onboarding.startOnboarding();
    }
  }, []);

  return (
    <Router>
      <div className="app-background">
        <header className="app-header">
          <h1>Product Authenticator</h1>
        </header>

        {/* Centered Button Row */}
        <div className="button-row">
          <ManufacturerButton />
          <CustomerButton />
        </div>

        <div className="container">
          <Routes>
            <Route path="/manufacturer" element={<Manufacturer />} />
            <Route path="/customer" element={<Customer />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function ManufacturerButton() {
  const navigate = useNavigate();
  return (
    <button className="nav-button" onClick={() => navigate('/manufacturer')}>
      Go to Manufacturer
    </button>
  );
}

function CustomerButton() {
  const navigate = useNavigate();
  return (
    <button className="nav-button" onClick={() => navigate('/customer')}>
      Go to Customer
    </button>
  );
}

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>Welcome to the Product Authenticator</h2>
      <p>Select a role to begin.</p>
    </div>
  );
}

export default App;
