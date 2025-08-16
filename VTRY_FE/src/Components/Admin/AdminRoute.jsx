import React from 'react';

const AdminRoute = ({ children }) => {
  const userRole = localStorage.getItem('user-role');
  const authToken = localStorage.getItem('auth-token');
  
  // Check if user is logged in and has admin role
  if (!authToken) {
    // Not logged in, redirect to login
    window.location.replace('/login');
    return null;
  }
  
  if (userRole !== 'admin') {
    // Not admin, redirect to home
    alert('Access denied. Admin privileges required.');
    window.location.replace('/');
    return null;
  }
  
  // User is admin, allow access
  return children;
};

export default AdminRoute;
