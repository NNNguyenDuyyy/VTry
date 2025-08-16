import React from "react";
import "./AdminLayout.css";
import AdminSidebar from "./AdminSidebar";
import AddProduct from "./AddProduct";
import ListProduct from "./ListProduct";
import AdminRoute from "./AdminRoute";
import { Route, Routes } from "react-router-dom";

const AdminLayout = () => {
  return (
    <AdminRoute>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <Routes>
            <Route path="addproduct" element={<AddProduct />} />
            <Route path="listproduct" element={<ListProduct />} />
          </Routes>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminLayout;
