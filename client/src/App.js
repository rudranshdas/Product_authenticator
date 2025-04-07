import React, { useEffect } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
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
    <div className="App">
      <header>
        <h1>Product Authenticator</h1>
      </header>
      <div className="container">
        <Manufacturer />
        <Customer />
      </div>
    </div>
  );
}

export default App;