"use client";

import React, { useEffect, useState } from "react";
import "./charity.css";

//this just tells the item to have a certain shape which will be taken from the api responses 
interface Item {
  Inventory_ID: number;
  Donation_ID: number;
  Description?: string | null;
  WeightKg?: number | null;
  Size_Label?: string | null;
  Gender_Label?: string | null;
  Season_Type?: string | null;
  Photo_URLs?: string[] | null;
}

export default function CharityShop() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/charity/inventory", {
          cache: "no-store",
        });

        const data = await res.json();

        // IMPORTANT: the API returns data.items
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
        } else {
          setItems([]); // fallback
        }

      } catch (e) {
        console.log("Couldn't fetch inventory:", e);
        setErr("Something went wrong loading items.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="Main-ContainerBox">
      <header className="Charity-Header">
        <a href="/" className="button button-outline">← Back</a>

        <div className="Header-Right-Buttons">
          <a className="button" href="/login">Login</a>
          <a className="button button-outline" href="/register">Register</a>
        </div>
      </header>

      <div className="Charity-Title-Section">
        <h1>Charity Shop</h1>
        <p>Browse items donated by the community.</p>
      </div>

      {err && <p style={{ color: "red", marginTop: 10 }}>{err}</p>}

      {loading ? (
        <p className="loading-text">Loading items…</p>
      ) : items.length === 0 ? (
        <p className="loading-text">No items right now. Check again later.</p>
      ) : (
        <div className="shop-grid">
          {items.map((it) => (
            <div className="shop-card" key={it.Inventory_ID}>

              {/* photos */}
              {it.Photo_URLs && it.Photo_URLs.length > 0 ? (
                <div className="shop-img-gallery">
                  {it.Photo_URLs.map((url, i) => (
                    <img key={i} src={url} alt={it.Description || "Item"} className="shop-img" />
                  ))}
                </div>
              ) : (
                <div className="shop-img-gallery no-img">
                  <span>No photo</span>
                </div>
              )}

              <div className="shop-info">
                <h3>{it.Description || "Unnamed item"}</h3>

                <p className="muted">
                  Weight: {it.WeightKg ? `${it.WeightKg} kg` : "N/A"}
                </p>

                {it.Size_Label && <p>Size: {it.Size_Label}</p>}
                {it.Gender_Label && <p>Gender: {it.Gender_Label}</p>}
                {it.Season_Type && <p>Season: {it.Season_Type}</p>}
              </div>

            </div>
          ))}
        </div>
      )}
    </main>
  );
}
