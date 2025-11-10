"use client";

import React, { useEffect, useState } from "react";
import "./report.css"; // This links to the CSS file for styling

// Defines what a "Donor" looks like (same as your database)
type Donor = {
  User_ID: number;
  Full_Name: string;
  Email: string;
};

// Defines what one line in the CO₂ report looks like
type ReportItem = {
  donationId: number;
  description: string;
  category: string;
  co2Saved: number;
};

export default function ReportPage() {
  // ---------- STATE VARIABLES ----------
  // These are used to store values in memory while the page is running
  const [donors, setDonors] = useState<Donor[]>([]); // List of all donors for dropdown
  const [selectedEmail, setSelectedEmail] = useState<string>(""); // The chosen donor
  const [rows, setRows] = useState<ReportItem[]>([]); // Donation data rows
  const [totalCO2, setTotalCO2] = useState<number>(0); // Total CO₂ saved
  const [landfillSaved, setLandfillSaved] = useState<number>(0); // Total landfill saved
  const [loading, setLoading] = useState<boolean>(false); // Shows "Generating..."
  const [error, setError] = useState<string>(""); // Shows errors if something fails
  const [generated, setGenerated] = useState<boolean>(false); // Used to hide/show report

  // ---------- STEP 1: FETCH ALL DONORS ----------
  useEffect(() => {
    // Runs only once when the page loads
    (async () => {
      try {
        const res = await fetch("/api/users/donors"); // Ask backend for all donor data
        if (!res.ok) throw new Error("Failed to load donors."); // If not OK → throw error
        const data: Donor[] = await res.json(); // Convert backend data into JSON
        setDonors(data); // Store donor list in state
      } catch (e) {
        console.error(e);
        setError("Could not load donors from the database."); // Display simple error
      }
    })();
  }, []);

  // ---------- STEP 2: GENERATE REPORT ----------
  async function handleGenerate() {
    setError(""); // Clear old errors
    setGenerated(false); // Hide old results
    setLoading(true); // Show "Generating..." button

    try {
      // Send donor email (or null for site-wide) to backend API
      const res = await fetch("/api/reports/co2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorEmail: selectedEmail || null }),
      });

      // If server returns an error, show message
      if (!res.ok) {
        const problem = await res.json().catch(() => ({}));
        setError(problem.error || "Error generating report.");
        return;
      }

      // Convert response into usable data
      const data = await res.json();

      // If the scope = "all", that means a site-wide report (totals only)
      if (data.scope === "all") {
        setTotalCO2(data.totalCO2);
        setLandfillSaved(data.landfillSavedKG);
        setRows([]); // Clear table rows (since no per-donor data)
      } else {
        // Otherwise, per-donor report (with detailed table)
        setTotalCO2(data.totalCO2);
        setLandfillSaved(data.landfillSavedKG);
        const items: ReportItem[] = (data.donations || []).map((d: any) => ({
          donationId: d.donationId,
          description: d.description,
          category: d.type,
          co2Saved: d.co2Saved,
        }));
        setRows(items);
      }

      setGenerated(true); // Show results
    } catch (e) {
      console.error(e);
      setError("Network error while generating report."); // Simple network error message
    } finally {
      setLoading(false); // Hide "Generating..." again
    }
  }

  // ---------- STEP 3: RENDER PAGE ----------
  return (
    <div className="report-wrap">
      {/* --- Top header --- */}
      <div className="report-header">
        <h1>CO₂ Emissions Report</h1>
        <a className="back-link" href="/admin">
          ← Back to Dashboard
        </a>
      </div>

      {/* --- Donor dropdown + Generate button --- */}
      <div className="selector">
        <select
          className="dropdown"
          value={selectedEmail}
          onChange={(e) => setSelectedEmail(e.target.value)}
        >
          {/* Default option to generate full site-wide summary */}
          <option value="">🌍 All Donors (site-wide)</option>

          {/* List all donors fetched from the database */}
          {donors.map((d) => (
            <option key={d.User_ID} value={d.Email}>
              {d.Full_Name} ({d.Email})
            </option>
          ))}
        </select>

        <button className="primary-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* --- Show errors if any --- */}
      {error && <p className="error">{error}</p>}

      {/* --- Show report output after generation --- */}
      {generated && (
        <div className="report-output">
          <h2>
            {selectedEmail
              ? `Donor Report for: ${selectedEmail}`
              : "Global CO₂ and Landfill Summary"}
          </h2>

          {/* If we have rows, show the full donation table */}
          {rows.length > 0 ? (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Donation ID</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>CO₂ Saved (kg)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.donationId}>
                    <td>{r.donationId}</td>
                    <td>{r.description}</td>
                    <td>{r.category}</td>
                    <td>{r.co2Saved}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}>
                    <strong>Total CO₂ Saved:</strong>
                  </td>
                  <td>
                    <strong>{totalCO2}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            // If it's a global report → show simple summary box
            <div className="summary-box">
              <p><strong>Total Donations:</strong> Saved in database</p>
              <p><strong>Total CO₂ Saved:</strong> {totalCO2} kg</p>
              <p><strong>Landfill Saved:</strong> {landfillSaved} kg</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
