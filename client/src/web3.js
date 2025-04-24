import { ethers } from "ethers";
import ProductAuth from '../build/contracts/ProductAuth.json'; // Make sure this file exists

const CONTRACT_ADDRESS = "0x43a16e5f9f444824Ed12832D6fD73F6E48720236"; // Replace with your deployed contract address

let provider;
let signer;
let contract;

export const initWeb3 = async () => {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ProductAuthABI, signer);
  } else {
    alert("MetaMask not found!");
  }
};

export const getContract = () => contract;
