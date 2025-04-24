import React, { useEffect, useState } from 'react';
import { initWeb3, getContract } from './web3';

function UserProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      await initWeb3();
      const contract = getContract();
      const address = await contract.signer.getAddress();
      const userProducts = await contract.getAllProductsForUser(address);
      setProducts(userProducts);
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Your Products</h2>
      <ul>
        {products.map((hash, index) => (
          <li key={index}>{hash}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserProducts;
