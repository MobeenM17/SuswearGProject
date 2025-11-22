"use client";

import React, { useEffect, useState } from "react";
import "./charity.css";

// This is the inventory item interface and the values we expect from the API calls
interface InventoryItem {
  Inventory_ID: number;
  Donation_ID: number;
  Description: string | null;
  WeightKg: number | null;
  Size_Label: string | null;
  Gender_Label: string | null;
  Season_Type: string | null;
  Photo_URLs: string[];
}

// Charity shop page component that fetches and displays inventory items from the charity API
export default function CharityShop() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);// Placeholder for images that fail to laod

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/charity/inventory", { cache: "no-store" });
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handles image loading errors by setting a fallback image
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = fallbackImage;
  };

  return (
    <main className="Main-ContainerBox">
      {/* Header Navigation */}
      <header className="Charity-Header">
        <a href="/" className="button button-outline"> ← Back Home</a>  {/* Removed Link component */}
        <div className="Header-Right-Buttons">
          <a href="/login" className="button">Login</a>
          <a href="/register" className="button button-outline">Register</a>
        </div>
      </header>

      {/* Page Title */}
      <section className="Charity-Title-Section">
        <h1>Charity Shop</h1>
        <p>Browse items donated by our amazing community through our partnered charity programs.</p>
      </section>

      {/* Inventory Grid */}
      {loading ? (
        <p className="loading-text">Loading items…</p>
      ) : items.length === 0 ? (
        <p className="loading-text">No items available right now.</p>
      ) : (
        <div className="shop-grid">
          {items.map((item) => (
            <div className="shop-card" key={item.Inventory_ID}>
              {item.Photo_URLs && item.Photo_URLs.length > 0 ? (
                <div className="shop-img-gallery">
                  {item.Photo_URLs.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={item.Description || "Item image"} // Alternative text for the image
                      className="shop-img"
                      onError={handleImgError}
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={fallbackImage}
                  alt="Placeholder" // Alternative text for the placeholder image
                  className="shop-img"
                />
              )}

              <div className="shop-info">
                <h3>{item.Description || "Unnamed item"}</h3>
                <p className="muted">
                  Weight: {item.WeightKg ? item.WeightKg + " kg" : "N/A"}
                </p>
                {item.Size_Label && <p>Size: {item.Size_Label}</p>}
                {item.Gender_Label && <p>Gender: {item.Gender_Label}</p>}
                {item.Season_Type && <p>Season: {item.Season_Type}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
