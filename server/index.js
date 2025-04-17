const express = require('express');
const { Web3 } = require('web3');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to Ganache
const web3 = new Web3('http://localhost:7545');
const contractABI = require('../build/contracts/ProductAuth.json').abi;
const contractAddress = '0xE7DAcE812E6D09EEe607cca07Bd521E042659a45'; // Replace after deployment

const productAuth = new web3.eth.Contract(contractABI, contractAddress);

// Check if address is contract owner
const isOwner = async (address) => {
  const owner = await productAuth.methods.owner().call();
  return owner.toLowerCase() === address.toLowerCase();
};

// Register new product
app.post('/api/products', async (req, res) => {
  const { productDetails, manufacturerAddress } = req.body;

  console.log("Incoming address:", manufacturerAddress);
  const owner = await productAuth.methods.owner().call();
  console.log("Contract owner:", owner);
  
  if (!await isOwner(manufacturerAddress)) {
    return res.status(403).json({ error: "Unauthorized: Not contract owner" });
  }

  try {
    const hash = web3.utils.keccak256(JSON.stringify(productDetails));
    
    await productAuth.methods.addProductHash(hash)
      .send({ from: manufacturerAddress, gas: 3000000 });
    
    const qrCode = await QRCode.toDataURL(hash);
    res.json({ hash, qrCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify product
app.post('/api/verify', async (req, res) => {
  const { hash } = req.body;
  
  try {
    const isValid = await productAuth.methods.verifyProduct(hash).call();
    res.json({ isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});