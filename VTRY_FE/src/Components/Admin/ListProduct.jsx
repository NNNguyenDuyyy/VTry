import React, { useEffect, useState } from "react";
import "./ListProduct.css";
import cross_icon from "../Assets/cross_icon.png";
import { backend_url, currency } from "../../App";

const ListProduct = () => {
  const [allproducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchInfo = () => {
    fetch(`${backend_url}/allproducts`)
      .then((res) => res.json())
      .then((data) => {
        setAllProducts(data);
        setFilteredProducts(data); // ban đầu hiển thị tất cả
      });
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const removeProduct = async (id) => {
    await fetch(`${backend_url}/removeproduct`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "auth-token": localStorage.getItem("auth-token"),
      },
      body: JSON.stringify({ id: id }),
    });

    fetchInfo();
  };

  // Xử lý khi chọn category
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);

    if (category === "all") {
      setFilteredProducts(allproducts);
    } else {
      setFilteredProducts(allproducts.filter((p) => p.category === category));
    }
  };

  return (
    <div className="listproduct">
      <div className="listproduct-header">
        <h1>All Products List</h1>
        {selectedCategory === "all" ? (
          <select value={selectedCategory} onChange={handleCategoryChange}>
            <option value="all">ALL</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="kid">Kid</option>
          </select>
        ) : (
          <div>
            <span style={{ fontWeight: "bold" }}>{selectedCategory.toUpperCase()}</span>
            <button onClick={() => setSelectedCategory("all")} style={{ marginLeft: "10px" }}>
              Change Category
            </button>
          </div>
        )}
      </div>

      <div className="listproduct-format-main">
        <p>Products</p> <p>Title</p> <p>Old Price</p> <p>New Price</p> <p>Category</p> <p>Remove</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {filteredProducts.map((e, index) => (
          <div key={index}>
            <div className="listproduct-format-main listproduct-format">
              <img
                className="listproduct-product-icon"
                src={backend_url + e.image}
                alt=""
              />
              <p className="cartitems-product-title">{e.name}</p>
              <p>
                {currency}
                {e.old_price}
              </p>
              <p>
                {currency}
                {e.new_price}
              </p>
              <p>{e.category}</p>
              <img
                className="listproduct-remove-icon"
                onClick={() => {
                  removeProduct(e.id);
                }}
                src={cross_icon}
                alt=""
              />
            </div>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListProduct;
