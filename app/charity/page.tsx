"use client";

import React, { useEffect, useState } from "react";
import "./charity.css";

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

// Charity Shop Page Component
export default function CharityShop() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fallbackImage = "/5868a1ce-0005-4324-918f-f28de1bc6a43.png"; // Placeholder image URL

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

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = fallbackImage;
  };

  return (
    <main className="Main-ContainerBox">
      {/* Header Navigation */}
      <header className="Charity-Header">
        <a href="/" className="button button-outline">← Back Home</a>
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
                      alt={item.Description || "Item image"}
                      className="shop-img"
                      onError={handleImgError}
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={fallbackImage}
                  alt="Placeholder"
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
