"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./donor.css";


//different status 
type DonationStatus = "Pending" | "Accepted" | "Rejected" | "Distributed";


//gets donations rows
interface Donation {
  Donation_ID: number;
  Description: string;
  Category: string;
  WeightKg: number | null;
  Status: DonationStatus;
  Submitted_At: string;
  PhotoUrl?: string | null;
}

interface NotificationRow {
  Notification_ID: number;
  Donation_ID: number;
  Status: string;
  Generated_At: string;
}


//the catagories
const CATEGORIES = [
  "Clothing",
  "Men",
  "Women",
  "Children",
  "Coats & Jackets",
  "Tops",
] as const;

export default function DonorDashboard() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number] | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [history, setHistory] = useState<Donation[]>([]);

  const [showNotifications, setShowNotifications] = useState(false); // panel toggle
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");

  //  Load donor history 
  const loadHistory = async () => {
    try {
      const res = await fetch("/api/donations/list-my", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load donation history");
      }
      const data: Donation[] = await res.json();
      setHistory(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(errorMsg);
      setMessage({ type: "error", text: errorMsg });
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  //  Load notifications only when panel is opened 
  useEffect(() => {
    if (!showNotifications) return;

    (async () => {
      try {
        setNotifError("");
        setNotifLoading(true);
        const res = await fetch("/api/notifications", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load notifications");
        }
        const data: NotificationRow[] = await res.json();
        setNotifications(data);
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Error loading notifications";
        setNotifError(errorMsg);
      } finally {
        setNotifLoading(false);
      }
    })();
  }, [showNotifications]);

  //  Impact calculations 
  const totalItems = history.length;
  const totalWeight = history.reduce(
    (acc, d) => acc + (d.WeightKg ?? 0),
    0
  );
  const co2Saved = +(totalWeight * 2.5).toFixed(2);

  //  Image handler 
  const onPhotoChange = (file: File | null) => {
    setPhotoFile(null);
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setMessage({ type: "error", text: "Image must be JPG or PNG." });
      return;
    }
    setPhotoFile(file);
    setMessage(null);
  };

  const resetForm = () => {
    setDescription("");
    setCategory("");
    setWeightKg("");
    setPhotoFile(null);
  };

  //Submit donation 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !category || !weightKg || !photoFile) {
      setMessage({
        type: "error",
        text: "You must complete all fields including an image.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("categoryId", category);
      formData.append(
        "weightKg",
        typeof weightKg === "number" ? weightKg.toString() : String(weightKg)
      );
      formData.append("photo", photoFile);

      const res = await fetch("/api/donations/create", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit donation");

      setMessage({ type: "success", text: "Donation submitted successfully." });
      resetForm();
      await loadHistory();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(errorMsg);
      setMessage({ type: "error", text: errorMsg });
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      router.push("/login");
    } catch {
      alert("Failed to log out.");
    }
  };

  // Close notifications panel 
  const closeNotifications = () => {
    setShowNotifications(false);
    setNotifError("");
  };

  return (
    <div className="donor-wrap Main-ContainerBox">
      <header className="donor-header">
        <div className="header-left">
          <span className="back-link" onClick={() => router.push("/")}>
            ← Back to homepage
          </span>
          <h1>Donor Dashboard</h1>
        </div>
        <div className="header-actions">
          <span
            className="outline-btn"
            onClick={() => router.push("/donor")}
          >
            Dashboard
          </span>
          <button
            type="button"
            className="outline-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            Notifications
          </button>

          <button
            type="button"
            className="outline-btn"
            onClick={() => router.push("/donor/sent")}
           >
            Sent Donations
          </button>

          <button className="ghost-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {message && (
        <div
          className={`alert ${
            message.type === "success" ? "alert-success" : "alert-error"
          }`}
        >
          {message.text}
          <button
            className="alert-close"
            onClick={() => setMessage(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* add a modifer class when notifications are visible */}
      <div className={`grid ${showNotifications ? "grid--with-notifications" : ""}`}>
        {/* Submit Donation */}
        <section className="card">
          <h2>Submit Donation</h2>
          <form onSubmit={handleSubmit} className="form">
            <label className="label">
              <span>Description</span>
              <textarea
                className="input"
                placeholder="e.g. Winter coat, good condition"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </label>

            <label className="label">
              <span>Category</span>
              <select
                className="input"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as (typeof CATEGORIES)[number])
                }
                required
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="label">
              <span>Weight (kg)</span>
              <input
                className="input"
                type="number"
                min={0}
                step={0.1}
                value={weightKg}
                onChange={(e) =>
                  setWeightKg(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
              />
            </label>

            <label className="label">
              <span>Upload Item Image</span>
              <input
                className="input file-input"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                required
              />
              <small className="hint">JPG or PNG only.</small>
            </label>

            <button className="primary-btn" type="submit">
              Upload
            </button>
          </form>
        </section>

        {/* Impact */}
        <section className="card impact">
          <h2>Your Impact</h2>
          <div className="stats">
            <div className="stat">
              <div className="stat-value">{totalItems}</div>
              <div className="stat-label">Total items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{totalWeight.toFixed(1)} kg</div>
              <div className="stat-label">Total weight</div>
            </div>
            <div className="stat">
              <div className="stat-value">{co2Saved} kg</div>
              <div className="stat-label">Estimated CO₂ saved</div>
            </div>
          </div>
          <p className="muted">*CO₂ estimate is approximate.</p>
        </section>

        {/* notifications card that docks to the right */}
        {showNotifications && (
          <aside className="card notifications-card">
            <div className="notification-header">
              <h2>Notifications</h2>
              <button
                type="button"
                className="ghost-btn notif-close-btn"
                onClick={closeNotifications}
              >
                ×
              </button>
            </div>

            {notifLoading ? (
              <p className="muted">Loading notifications…</p>
            ) : notifError ? (
              <p className="notification-error">{notifError}</p>
            ) : notifications.length === 0 ? (
              <p className="muted">No notifications yet.</p>
            ) : (
              <ul className="notification-list">
                {notifications.map((n) => (
                  <li key={n.Notification_ID} className="notification-item">
                    <div className="notification-top">
                      <span className="notification-title">
                        Donation #{n.Donation_ID}
                      </span>
                      <span
                        className={
                          n.Status === "Accepted"
                            ? "badge-accepted"
                            : n.Status === "Rejected"
                            ? "badge-rejected"
                            : "badge"
                        }
                      >
                        {n.Status}
                      </span>
                    </div>
                    <span className="notification-date">
                      {new Date(n.Generated_At).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        {/* Donation History */}
        <section className="card history">
          <h2>Donation History</h2>
          {history.length === 0 ? (
            <div className="empty">No donations found.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((d, idx) => (
                    <tr key={`${d.Donation_ID}-${idx}`}>
                      <td>{d.Donation_ID}</td>
                      <td>{d.Description}</td>
                      <td>{d.Category}</td>
                      <td>
                        {d.WeightKg !== null ? d.WeightKg.toFixed(1) : "-"}
                      </td>
                      <td>
                        <span className={`badge ${d.Status.toLowerCase()}`}>
                          {d.Status}
                        </span>
                      </td>
                      <td>
                        {new Date(d.Submitted_At).toLocaleDateString()}
                      </td>
                      <td>
                        {d.PhotoUrl ? (
                          <img
                            src={d.PhotoUrl}
                            alt={`Donation ${d.Donation_ID}`}
                            className="thumb"
                          />
                        ) : (
                          <span className="muted">No Image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
