"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Added for navigation
import "./donor.css";

type DonationStatus = "pending" | "accepted" | "rejected" | "distributed";

type Donation = {
  id: string;
  description: string;
  category: string;
  weightKg: number;
  status: DonationStatus;
  submittedAt: string; // ISO
  photoUrl?: string;
};

const CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Footwear", "Accessories", "Other"] as const;

export default function DonorDashboard() {
  const router = useRouter(); // ✅ Initialize router for redirect

  // -------- Submit form state --------
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number] | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // -------- Donation history (temporary mock) --------
  const [history, setHistory] = useState<Donation[]>([
    {
      id: "DN-001",
      description: "Blue denim jacket",
      category: "Outerwear",
      weightKg: 1.2,
      status: "accepted",
      submittedAt: "2025-10-02T10:31:00Z",
      photoUrl: "/placeholder-denim.png",
    },
    {
      id: "DN-002",
      description: "Black trainers (size 9)",
      category: "Footwear",
      weightKg: 0.9,
      status: "distributed",
      submittedAt: "2025-10-20T14:12:00Z",
    },
    {
      id: "DN-003",
      description: "Mixed tees (x5)",
      category: "Tops",
      weightKg: 1.1,
      status: "pending",
      submittedAt: "2025-11-02T09:05:00Z",
    },
  ]);

  // -------- Filters --------
  const [statusFilter, setStatusFilter] = useState<"" | DonationStatus>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const filteredHistory = useMemo(() => {
    return history.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      const t = new Date(d.submittedAt).getTime();
      if (fromDate && t < new Date(fromDate).getTime()) return false;
      if (toDate && t > new Date(toDate).getTime()) return false;
      return true;
    });
  }, [history, statusFilter, fromDate, toDate]);

  // -------- Impact calculation --------
  const totalItems = filteredHistory.length;
  const totalWeight = filteredHistory.reduce((acc, d) => acc + (d.weightKg || 0), 0);
  const co2Saved = +(totalWeight * 2.5).toFixed(2);

  // -------- Image and form handlers --------
  const onPhotoChange = (f: File | null) => {
    setPhotoFile(null);
    if (!f) return;
    const ok = ["image/jpeg", "image/png"].includes(f.type);
    if (!ok) {
      setMessage({ type: "error", text: "The image file type must be JPG or PNG." });
      return;
    }
    setMessage(null);
    setPhotoFile(f);
  };

  const resetForm = () => {
    setDescription("");
    setCategory("");
    setWeightKg("");
    setPhotoFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !category || !weightKg || !photoFile) {
      setMessage({
        type: "error",
        text: "You must complete all the fields (including a JPG/PNG image) to submit your donation.",
      });
      return;
    }

    const newDonation: Donation = {
      id: `DN-${String(history.length + 1).padStart(3, "0")}`,
      description: description.trim(),
      category,
      weightKg: typeof weightKg === "number" ? weightKg : parseFloat(weightKg),
      status: "pending",
      submittedAt: new Date().toISOString(),
      photoUrl: URL.createObjectURL(photoFile),
    };

    setHistory((h) => [newDonation, ...h]);
    setMessage({ type: "success", text: "This Donation has been successfully submitted." });
    resetForm();
  };

  //LOGOUT FUNCTION
  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/"); // back to homepage
    } catch {
      alert("Failed to log out. Please try again.");
    }
  }

  return (
    <div className="donor-wrap Main-ContainerBox">
      {/* ---------- Header Section ---------- */}
      <header className="donor-header">
        <div className="header-left">
          <a className="back-link" href="/">← Back to homepage</a>
          <h1>Donor Dashboard</h1>
        </div>
        <div className="header-actions">
          <a className="outline-btn" href="/donor">Dashboard</a>
          <button className="ghost-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* ---------- Alerts ---------- */}
      {message && (
        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
          {message.text}
          <button className="alert-close" onClick={() => setMessage(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* ---------- Grid Layout ---------- */}
      <div className="grid">
        {/* Submit Donation */}
        <section className="card">
          <h2>Submit Donation</h2>
          <form onSubmit={handleSubmit} className="form">
            <label className="label">
              <span>Description</span>
              <textarea
                className="input"
                placeholder="e.g. 'Winter coat, good condition'"
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
                onChange={(e) => setCategory(e.target.value as any)}
                required
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="label">
              <span>Weight (kg)</span>
              <input
                className="input"
                type="number"
                min={0}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 1.2"
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

            <button className="primary-btn" type="submit">Upload</button>
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
          <p className="muted">*CO₂ estimate is indicative and will be replaced with real metrics later.</p>
        </section>

        {/* History */}
        <section className="card history">
          <div className="history-head">
            <h2>Donation History</h2>
            <div className="filters">
              <select
                className="input small"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="distributed">Distributed</option>
              </select>

              <input
                className="input small"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
              />
              <input
                className="input small"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To date"
              />
              <button
                className="ghost-btn"
                onClick={() => { setStatusFilter(""); setFromDate(""); setToDate(""); }}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty">You haven’t made a donation yet.</div>
          ) : (
            <div className="table-wrap" role="region" aria-label="Donation history">
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
                  {filteredHistory.map((d) => (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td>{d.description}</td>
                      <td>{d.category}</td>
                      <td>{d.weightKg.toFixed(1)} kg</td>
                      <td><span className={`badge ${d.status}`}>{d.status}</span></td>
                      <td>{new Date(d.submittedAt).toLocaleDateString()}</td>
                      <td>
                        {d.photoUrl
                          ? <img src={d.photoUrl} alt="" className="thumb" />
                          : <span className="muted">Image not available</span>}
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
