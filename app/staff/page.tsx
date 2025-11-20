"use client";

import { useEffect, useState } from "react";
import "./staff.css";
import { useRouter } from "next/navigation";

/** Row shown in the pending table */
type PendingDonation = {
  Donation_ID: number;
  Donor_Name: string;
  Description: string;
  Condition_Grade: string | null;
  Category: string;
  Submitted_At: string;
  PhotoUrl?: string | null; 
};

/** sent to /api/donations/review */
type ReviewAction = {
  donationId: number;
  action: "accept" | "reject";
  reason?: string;

  // used only when accepting (to create/keep Inventory)
  sizeLabel?: string;
  genderLabel?: string;
  seasonType?: string;
  conditionGrade?: string;
};

export default function StaffDashboard() {
  const [rows, setRows] = useState<PendingDonation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<PendingDonation | null>(null);

  const [sizeLabel, setSizeLabel] = useState("");
  const [genderLabel, setGenderLabel] = useState("");
  const [seasonType, setSeasonType] = useState("");
  const [conditionGrade, setConditionGrade] = useState("");

  const router = useRouter();

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    setSizeLabel("");
    setGenderLabel("");
    setSeasonType(suggestSeason(selected?.Category ?? ""));
    setConditionGrade(selected?.Condition_Grade || "");
  }, [selected?.Donation_ID]);

  function suggestSeason(category: string) {
    const c = category.toLowerCase();
    if (c.includes("coat") || c.includes("jacket")) return "Winter";
    if (c.includes("tops") || c.includes("t-shirt")) return "Summer";
    if (c.includes("footwear")) return "All-Season";
    return "";
  }

  async function refreshList() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/donations/list", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to load donations.");
      }
      const data: PendingDonation[] = await res.json();
      setRows(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load donations.");
    } finally {
      setLoading(false);
    }
  }

  async function sendDecision(payload: ReviewAction) {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/donations/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Could not save decision.");
      }

      setRows((prev) => prev.filter((r) => r.Donation_ID !== payload.donationId));
      setSelected(null);
      setSizeLabel("");
      setGenderLabel("");
      setSeasonType("");
      setConditionGrade("");

      setMessage(
        payload.action === "accept"
          ? "Donation has been accepted and moved to stock."
          : "Donation has been rejected and donor will be notified."
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to upload decision.");
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) router.push("/login");
      else alert("Failed to logout. Please try again.");
    } catch (err: unknown) {
      console.error(err);
      alert("Error logging out. Please try again.");
    }
  }

  async function handleAccept(d: PendingDonation) {
    if (!sizeLabel || !genderLabel || !seasonType) {
      alert("Please select Size, Gender and Season before accepting.");
      return;
    }
    const ok = confirm(`Accept donation #${d.Donation_ID} from ${d.Donor_Name}?`);
    if (!ok) return;

    const reasonInput = prompt("Optional note for record (press Cancel to skip):");
    const reason = reasonInput === null ? undefined : reasonInput;

    await sendDecision({
      donationId: d.Donation_ID,
      action: "accept",
      reason,
      sizeLabel,
      genderLabel,
      seasonType,
      conditionGrade,
    });
  }

  async function handleReject(d: PendingDonation) {
    const reasonInput = prompt(`Reason for rejecting donation #${d.Donation_ID}? (optional)`);
    const reason = reasonInput === null ? undefined : reasonInput;
    await sendDecision({ donationId: d.Donation_ID, action: "reject", reason });
  }

  const acceptDisabled = !selected || !sizeLabel || !genderLabel || !seasonType;

  return (
    <div className="staff-wrap">
      <header className="staff-header">
        <div className="left">
          <h1>Staff Dashboard</h1>
        </div>
        <div className="right">
          <button className="ghost-btn" onClick={refreshList} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="outline-btn logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {message && (
        <div className="alert alert-success">
          {message}
          <button className="alert-close" onClick={() => setMessage("")} aria-label="Close">×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError("")} aria-label="Close">×</button>
        </div>
      )}

      <div className="grid">
        {/* pending table */}
        <section className="card">
          <div className="table-head">
            <h2>Pending Donations</h2>
            <span className="muted">{rows.length} waiting</span>
          </div>

          <div className="table-wrap" role="region" aria-label="Pending donations">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Donor</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Description</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted">Nothing pending right now.</td>
                  </tr>
                ) : (
                  rows.map((d) => (
                    <tr key={d.Donation_ID} className={selected?.Donation_ID === d.Donation_ID ? "active" : ""}>
                      <td>{d.Donation_ID}</td>
                      <td>{d.Donor_Name}</td>
                      <td>{d.Category}</td>
                      <td>{d.Condition_Grade}</td>
                      <td className="desc-cell">{d.Description}</td>
                      <td>{d.Submitted_At ? new Date(d.Submitted_At).toLocaleDateString() : "—"}</td>
                      <td className="actions">
                        <button className="outline-btn" onClick={() => setSelected(d)}>View</button>
                        <button className="primary-btn" onClick={() => setSelected(d)}>Review</button>
                        <button className="ghost-btn danger" onClick={() => handleReject(d)}>Reject</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* details + accept form */}
        <aside className="card details">
          <h2>Details</h2>
          {!selected ? (
            <p className="muted">Select a row to see more info.</p>
          ) : (
            <div className="detail-grid">
              <p><strong>ID:</strong> {selected.Donation_ID}</p>
              <p><strong>Donor:</strong> {selected.Donor_Name}</p>
              <p><strong>Category:</strong> {selected.Category}</p>
              <p><strong>Condition:</strong> {selected.Condition_Grade}</p>
              <p className="full"><strong>Description:</strong><br />{selected.Description}</p>
              {selected.PhotoUrl && (
                <div className="full">
                  <strong>Photo Preview:</strong>
                  <div className="photo-wrapper">
                    <img src={selected.PhotoUrl} alt={`Donation ${selected.Donation_ID}`} className="donation-photo" />
                  </div>
                </div>
              )}

              <div className="full">
                <label className="muted">Inventory details (used only when you Accept)</label>
              </div>

              <label>
                Size label
                <input className="textin" placeholder="e.g., S / M / L / 10 / etc." value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)} />
              </label>

              <label>
                Gender label
                <select className="selectin" value={genderLabel} onChange={(e) => setGenderLabel(e.target.value)}>
                  <option value="">(none)</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Children">Children</option>
                </select>
              </label>

              <label className="full">
                Condition Grade
                <select className="selectin" value={conditionGrade} onChange={(e) => setConditionGrade(e.target.value)}>
                  <option value="">(not set)</option>
                  <option value="A">(A - Like New)</option>
                  <option value="B">(B - Good / Slightly Worn)</option>
                  <option value="C">(C - Worn)</option>
                </select>
              </label>

              <label>
                Season
                <select className="selectin" value={seasonType} onChange={(e) => setSeasonType(e.target.value)}>
                  <option value="">(none)</option>
                  <option value="Winter">Winter</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Autumn">Autumn</option>
                  <option value="All-Season">All-Season</option>
                </select>
              </label>

              <div className="button-row">
                <button className="primary-btn" onClick={() => handleAccept(selected!)} disabled={acceptDisabled}>
                  Accept
                </button>
                <button className="ghost-btn danger" onClick={() => handleReject(selected!)}>Reject</button>
                <button className="ghost-btn" onClick={() => setSelected(null)}>Close</button>
              </div>

              <small className="muted">
                Accept marks the donation as <b>Accepted</b>, writes a <b>Review</b>, and creates/keeps an <b>Inventory</b> record using the Size/Gender/Season above. Reject writes a Review only.
              </small>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
