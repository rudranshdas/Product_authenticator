import React, { useState } from 'react';
import { initWeb3, getContract } from './web3';

function AdminPanel() {
  const [userAddress, setUserAddress] = useState('');
  const [role, setRole] = useState(1); // 0 = Admin, 1 = Manager, 2 = User

  const assignRole = async () => {
    try {
      await initWeb3();
      const contract = getContract();
      const tx = await contract.assignRole(userAddress, role);
      await tx.wait();
      alert("Role assigned!");
    } catch (err) {
      console.error(err);
      alert("Failed to assign role.");
    }
  };

  return (
    <div>
      <h3>Assign Role</h3>
      <input value={userAddress} onChange={(e) => setUserAddress(e.target.value)} placeholder="User Address" />
      <select value={role} onChange={(e) => setRole(Number(e.target.value))}>
        <option value="0">Admin</option>
        <option value="1">Manager</option>
        <option value="2">User</option>
      </select>
      <button onClick={assignRole}>Assign</button>
    </div>
  );
}

export default AdminPanel;
