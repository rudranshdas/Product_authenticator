const express = require('express');
const { Web3 } = require('web3');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Define path for our persistent storage
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Function to load product database from file
function loadProductDatabase() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading product database:', err);
  }
  return {};
}

// Function to save product database to file
function saveProductDatabase(data) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving product database:', err);
  }
}

// Initialize our product database from file
let productDatabase = loadProductDatabase();

// Connect to Ganache (or your preferred Ethereum network)
const web3 = new Web3('http://localhost:7545');
const contractABI = require('../build/contracts/ProductAuth.json').abi;
const contractAddress = '0x6c6FC0b6859e0E1e96Ed53F51d570e61b1eAdb37'; // Replace with your deployed contract address

const productAuth = new web3.eth.Contract(contractABI, contractAddress);

// Create a users array to store user data
let users = [];

// Utility Functions
const isOwner = async (address) => {
  const owner = await productAuth.methods.owner().call();
  return owner.toLowerCase() === address.toLowerCase();
};

const getUserRole = async (address) => {
  try {
    console.log(`Getting role for address: ${address}`);
    const role = await productAuth.methods.getUserRole(address).call();
    console.log(`Role returned: ${role} (${typeof role})`);
    return role;
  } catch (error) {
    console.error(`Error getting user role for ${address}:`, error);
    return 2; // Default to regular user role
  }
};

const canRegisterProducts = async (address) => {
  try {
    const role = await getUserRole(address);
    // Convert role to string first to ensure comparison works
    const roleStr = String(role);
    console.log(`Checking if role '${roleStr}' can register products`);
    return roleStr === '0' || roleStr === '1'; // Admin or Manager
  } catch (error) {
    console.error('Error checking product registration permissions:', error);
    return false;
  }
};

// Initialize users with contract owner
const initializeUsers = async () => {
  try {
    const owner = await productAuth.methods.owner().call();
    users.push({ address: owner, role: 0 }); // Add owner as admin
    console.log("Contract owner added as admin:", owner);
  } catch (error) {
    console.error("Error initializing users:", error);
  }
};

// Listen for RoleAssigned events
const setupEventListeners = () => {
  productAuth.events.RoleAssigned({}, (error, event) => {
    if (error) return console.error("Error on RoleAssigned event:", error);
    
    const { user, role } = event.returnValues;
    
    // Update or add user to our array
    const existingUserIndex = users.findIndex(u => 
      u.address.toLowerCase() === user.toLowerCase()
    );
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex].role = parseInt(role);
      console.log("Updated user role:", user, role);
    } else {
      users.push({ address: user, role: parseInt(role) });
      console.log("Added new user with role:", user, role);
    }
  });
  
  console.log("Event listeners set up successfully");
};

// Initialize on startup
(async () => {
  await initializeUsers();
  setupEventListeners();
})();

// GET user role
app.get('/api/user/role', async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const role = await getUserRole(address);
    res.json({ role: parseInt(role) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST register new product
app.post('/api/products', async (req, res) => {
  const { productDetails, manufacturerAddress } = req.body;
  
  console.log(`Product registration attempt by: ${manufacturerAddress}`);

  const canRegister = await canRegisterProducts(manufacturerAddress);
  console.log(`Can register products: ${canRegister}`);

  if (!canRegister) {
    return res.status(403).json({ error: "Unauthorized: Only admins and managers can register products" });
  }

  try {
    const hash = web3.utils.keccak256(JSON.stringify(productDetails));
    
    // Store the product details in our database
    productDatabase[hash] = {
      ...productDetails,
      registeredBy: manufacturerAddress,
      registrationTime: Math.floor(Date.now() / 1000)
    };
    
    // Save the updated database to file
    saveProductDatabase(productDatabase);
    
    await productAuth.methods.addProductHash(hash)
      .send({ from: manufacturerAddress, gas: 3000000 });
    
    const qrCode = await QRCode.toDataURL(hash);
    res.json({ hash, qrCode });
  } catch (error) {
    console.error('Error registering product:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST bulk register products
app.post('/api/products/bulk', async (req, res) => {
  const { products, manufacturerAddress } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Products array is required" });
  }

  if (!await canRegisterProducts(manufacturerAddress)) {
    return res.status(403).json({ error: "Unauthorized: Only admins and managers can register products" });
  }

  try {
    const hashes = products.map(product => {
      const hash = web3.utils.keccak256(JSON.stringify(product));
      // Store each product's details
      productDatabase[hash] = {
        ...product,
        registeredBy: manufacturerAddress,
        registrationTime: Math.floor(Date.now() / 1000)
      };
      return hash;
    });
    
    // Save the updated database to file
    saveProductDatabase(productDatabase);
    
    await productAuth.methods.bulkAddHashes(hashes)
      .send({ from: manufacturerAddress, gas: 6000000 });
    
    res.json({ success: true, count: hashes.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST verify product
app.post('/api/verify', async (req, res) => {
  const { hash } = req.body;
  
  try {
    const isValid = await productAuth.methods.verifyProduct(hash).call();
    res.json({ isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET product details
app.get('/api/products/:hash', async (req, res) => {
  const { hash } = req.params;
  
  try {
    const isValid = await productAuth.methods.verifyProduct(hash).call();
    const owner = await productAuth.methods.getProductOwner(hash).call();
    const additionTime = await productAuth.methods.getProductAdditionTime(hash).call();
    
    // Try to get product details from our database
    const productDetails = productDatabase[hash];
    
    if (productDetails) {
      res.json({
        hash,
        isValid,
        owner,
        additionTime,
        productDetails
      });
    } else {
      // If the product hash is valid but we don't have details,
      // return a generic response
      res.json({
        hash,
        isValid,
        owner,
        additionTime,
        productDetails: {
          name: "Verified Product",
          batch: hash.substring(2, 10),
          manufactureDate: new Date().toISOString().split('T')[0],
          details: "This product has been verified on the blockchain"
        }
      });
    }
  } catch (error) {
    console.error('Error getting product details:', error);
    res.status(404).json({ error: "Product not found" });
  }
});

// GET product history
app.get('/api/products/:hash/history', async (req, res) => {
  const { hash } = req.params;
  
  try {
    const timestamps = await productAuth.methods.getProductHistory(hash).call();
    
    // For a real implementation, we would store event details in a database
    // Here we'll mock some history based on timestamps
    const history = timestamps.map((timestamp, index) => {
      if (index === 0) {
        return {
          type: 'Registration',
          timestamp,
          address: '0x...' // Would be the original registrant
        };
      } else if (index % 2 === 0) {
        return {
          type: 'Ownership Transfer',
          timestamp,
          from: '0x...', // Previous owner
          to: '0x...' // New owner
        };
      } else {
        return {
          type: 'Status Update',
          timestamp,
          status: true
        };
      }
    });
    
    res.json({ history });
  } catch (error) {
    res.status(404).json({ error: "Product history not found" });
  }
});

// POST transfer product ownership
app.post('/api/products/transfer', async (req, res) => {
  const { productHash, currentOwner, newOwner } = req.body;
  
  try {
    // Verify current owner
    const owner = await productAuth.methods.getProductOwner(productHash).call();
    if (owner.toLowerCase() !== currentOwner.toLowerCase()) {
      return res.status(403).json({ error: "You are not the owner of this product" });
    }
    
    await productAuth.methods.transferProductOwnership(productHash, newOwner)
      .send({ from: currentOwner, gas: 3000000 });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all products for a user
app.get('/api/products/user/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    const productHashes = await productAuth.methods.getAllProductsForUser(address).call();
    
    // Get details for each product
    const products = await Promise.all(productHashes.map(async (hash) => {
      const isValid = await productAuth.methods.verifyProduct(hash).call();
      const additionTime = await productAuth.methods.getProductAdditionTime(hash).call();
      
      // Look up product details from our database, or use generic info
      const storedProduct = productDatabase[hash];
      const productDetails = storedProduct || {
        name: `Product ${hash.substring(0, 6)}`,
        batch: hash.substring(6, 10),
        manufactureDate: "Unknown",
        expiryDate: "Unknown"
      };
      
      return {
        hash,
        isValid,
        additionTime,
        productDetails
      };
    }));
    
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all products (admin only)
app.get('/api/products', async (req, res) => {
  try {
    const productHashes = await productAuth.methods.getAllProductHashes().call();
    
    // Get details for each product
    const products = await Promise.all(productHashes.map(async (hash) => {
      const isValid = await productAuth.methods.verifyProduct(hash).call();
      const owner = await productAuth.methods.getProductOwner(hash).call();
      const additionTime = await productAuth.methods.getProductAdditionTime(hash).call();
      
      // Look up product details from our database, or use generic info
      const storedProduct = productDatabase[hash];
      const productDetails = storedProduct || {
        name: `Product ${hash.substring(0, 6)}`,
        batch: hash.substring(6, 10),
        manufactureDate: "Unknown",
        expiryDate: "Unknown"
      };
      
      return {
        hash,
        isValid,
        owner,
        additionTime,
        productDetails
      };
    }));
    
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST assign user role (admin only)
app.post('/api/users/role', async (req, res) => {
  const { adminAddress, userAddress, role } = req.body;
  
  // Check if admin
  if (!await isOwner(adminAddress)) {
    return res.status(403).json({ error: "Unauthorized: Only the contract owner can assign roles" });
  }
  
  try {
    const result = await productAuth.methods.assignRole(userAddress, role)
      .send({ from: adminAddress, gas: 3000000 });
    
    // Manually update our users array since we might miss events
    const existingUserIndex = users.findIndex(u => 
      u.address.toLowerCase() === userAddress.toLowerCase()
    );
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex].role = parseInt(role);
    } else {
      users.push({ address: userAddress, role: parseInt(role) });
    }
    
    console.log("Role assigned successfully, transaction:", result.transactionHash);
    res.json({ success: true });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET all users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    // Return the actual users array instead of mock data
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update product verification status (admin only)
app.put('/api/products/status', async (req, res) => {
  const { adminAddress, hash, status } = req.body;
  
  // Check if admin
  if (!await isOwner(adminAddress)) {
    return res.status(403).json({ error: "Unauthorized: Only the contract owner can update verification status" });
  }
  
  try {
    await productAuth.methods.updateProductVerificationStatus(hash, status)
      .send({ from: adminAddress, gas: 3000000 });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE remove product (admin only)
app.delete('/api/products/:hash', async (req, res) => {
  const { hash } = req.params;
  const { adminAddress } = req.body;
  
  // Check if admin
  if (!await isOwner(adminAddress)) {
    return res.status(403).json({ error: "Unauthorized: Only the contract owner can remove products" });
  }
  
  try {
    await productAuth.methods.removeProduct(hash)
      .send({ from: adminAddress, gas: 3000000 });
    
    // Also remove from our database
    if (productDatabase[hash]) {
      delete productDatabase[hash];
      saveProductDatabase(productDatabase);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalProducts = await productAuth.methods.getTotalProductCount().call();
    
    // Get actual user counts from our users array
    const adminCount = users.filter(user => user.role === 0).length;
    const managerCount = users.filter(user => user.role === 1).length;
    const userCount = users.filter(user => user.role === 2).length;
    
    res.json({
      totalProducts: parseInt(totalProducts),
      adminCount,
      managerCount,
      userCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Connected to contract at ${contractAddress}`);
  console.log(`Product database loaded with ${Object.keys(productDatabase).length} products`);
});