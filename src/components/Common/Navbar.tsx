import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '2rem' }}>
      <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
      <Link to="/transactions" style={{ marginRight: '1rem' }}>Transactions</Link>
      <Link to="/users" style={{ marginRight: '1rem' }}>Users</Link>
      <Link to="/logout">Logout</Link>
    </nav>
  );
};

export default Navbar;
