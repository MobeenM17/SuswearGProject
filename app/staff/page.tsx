"use client";

import { useEffect, useState } from "react";
import "./staff.css"; // styles for this page
import { useRouter } from "next/navigation"; // for redirect after logout


type PendingDonation = {
  Donation_ID: number;      // PK from Donations
  Donor_Name: string;       // Users.Full_Name - joined for full name 
  Description: string;      // Donations.Description
  Condition_Grade: string;  // e.g., A/B/C
  Category: string;         // Categories.Name - joined for catagory name
  Submitted_At: string;    // Timestamp
};


type ReviewAction = {
  donationId: number;       // the donation which needs to update
  action: "accept" | "reject"; // staff select which action they want to do 
  reason?: string;           // optional reason
};

export default function StaffDashboard() {

  const [rows, setRows] = useState<PendingDonation[]>([]); // table data
  const [loading, setLoading] = useState<boolean>(false);  // spinner
  const [error, setError] = useState<string>("");          // error message
  const [message, setMessage] = useState<string>("");      // success message
  const [selected, setSelected] = useState<PendingDonation | null>(null); // current row
  const router = useRouter(); // route for logout

  // Loads the pending donation in the background
  useEffect(() => {
    refreshList(); // call our function that fetches table data
  }, []);

  // Gets all the pending donations from /api/donations/list
  async function refreshList() {
    setError("");          // clear old errors
    setMessage("");        // clear old messages
    setLoading(true);      // show spinner

    try {
      const res = await fetch("/api/donations/list", { cache: "no-store" }); // always fresh
      if (!res.ok) {
        // Shows an error message if database fails
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to load donations.");
      }
      //Gets all the pending rows from backend and reads through them
      const data: PendingDonation[] = await res.json();
      setRows(data);       // update the table
    } catch (e: any) {
      // Error message if donation could not be loaded
      setError(e?.message || "Could not load donations.");
    } finally {
      // hide spinner
      setLoading(false);
    }
  }

  // Sends an accept/reject decision to /api/donations/review
  async function sendDecision(payload: ReviewAction) {
    setError("");  //clears the messages
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

      // Remove that row from the table
      setRows((prev) => prev.filter((r) => r.Donation_ID !== payload.donationId));
      setSelected(null); 

      // Successful message
      setMessage(
        payload.action === "accept"
          ? "Donation has been accepted and moved to stock."
          : "Donation has been rejected and donor will be notified."
      );
    } catch (e: any) { // Catches any error messages and shows
      setError(e?.message || "Failed to upload decision.");
    }
  }

  // Logs the user out and redirects to login
async function handleLogout() {
  try {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) {
      router.push("/login"); // Redirect back to login page
    } else {
      alert("Failed to logout. Please try again.");
    }
  } catch (err) {
    console.error(err);
    alert("Error logging out. Please try again.");
  }
}


  // Handles all the accept data;
  async function handleAccept(d: PendingDonation) {
    // Lightweight confirm to prevent misclicks
    const ok = confirm(`Accept donation #${d.Donation_ID} from ${d.Donor_Name}?`);
    if (!ok) return;

    // Gives staff a chance to add an optional note
    const reason = prompt("Optional note for record (press Cancel to skip):") || undefined; // makes it optional

    // Gets the API
    await sendDecision({ donationId: d.Donation_ID, action: "accept", reason });
  }

  // Handles all the reject data
  async function handleReject(d: PendingDonation) {
    // Add a reasoning - not optional
    const reason = prompt(`Reason for rejecting donation #${d.Donation_ID}? (optional)`) || undefined;
    await sendDecision({ donationId: d.Donation_ID, action: "reject", reason: reason }); // puts it all together and sends the data
  }
//page design
  return (
    <div className="staff-wrap">
      {/* --- Sticky header with actions --- */}
      <header className="staff-header">
        <div className="left">
        <h1>Staff Dashboard</h1>
        <a className="back-link" href="/">← Back to homepage</a>
      </div>
      <div className="right">
        <button className="ghost-btn" onClick={refreshList} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        <button className="outline-btn logout-btn" onClick={handleLogout}>
          Logout </button>
          </div>
        </header>

      {/*Info / error banners*/}
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
        {/* Creates table for pending donation */}
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
                        <button className="primary-btn" onClick={() => handleAccept(d)}>Accept</button>
                        <button className="ghost-btn danger" onClick={() => handleReject(d)}>Reject</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/*  Selected row - details panel  */}
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
              <p className="full">
                <strong>Description:</strong><br />
                {selected.Description}
              </p>

              <div className="button-row">
                <button className="primary-btn" onClick={() => handleAccept(selected)}>Accept</button>
                <button className="ghost-btn danger" onClick={() => handleReject(selected)}>Reject</button>
                <button className="ghost-btn" onClick={() => setSelected(null)}>Close</button>

              </div>

              <small className="muted">
                Accept = marks as <b>Accepted</b> and (later) staff can add to <b>Inventory</b>.  
                Reject = marks as <b>Rejected</b> and (later) creates a <b>Notification</b> for the donor. 
              </small>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
