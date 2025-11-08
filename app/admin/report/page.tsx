"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./report.css"; // make this file, similar to admin.css

interface Donor {
  User_ID: number;
  name: string;
  Email: string;
}

interface ReportItem {
  donationId: number;
  description: string;
  type: string;
  co2Saved: number;
}

export default function ReportPage() {
  const router = useRouter();

  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedDonorEmail, setSelectedDonorEmail] = useState("");
  const [report, setReport] = useState<ReportItem[]>([]);
  const [totalCO2, setTotalCO2] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState("");

  // --- Fetch donors for dropdown ---
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const res = await fetch("/api/users/donors");
        if (!res.ok) throw new Error("Failed to load donors");
        const data = await res.json();
        setDonors(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load donors");
      }
    };
    fetchDonors();
  }, []);

  // --- Generate CO2 report ---
  const handleGenerate = async () => {
    if (!selectedDonorEmail) {
      setError("Please select a donor");
      return;
    }
    setError("");
    setIsGenerated(false);

    try {
      const res = await fetch("/api/reports/co2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorEmail: selectedDonorEmail }),
      });

      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();

      setReport(data.donations || []);
      setTotalCO2(data.totalCO2 || 0);
      setIsGenerated(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate report");
    }
  };

  return (
    <div className="report-wrap">
      <div className="report-header">
        <h1>CO₂ Emissions Report</h1>
        <a href="/admin" className="back-link">
          ← Back to Dashboard
        </a>
      </div>

      <div className="selector">
        <select
          className="dropdown"
          value={selectedDonorEmail}
          onChange={(e) => setSelectedDonorEmail(e.target.value)}
        >
          <option value="">Select Donor</option>
          {donors.map((d) => (
            <option key={d.User_ID} value={d.Email}>
              {d.name} ({d.Email})
            </option>
          ))}
        </select>

        <button className="primary-btn" onClick={handleGenerate}>
          Generate Report
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {isGenerated && (
        <div className="report-output">
          <h2>Donor: {selectedDonorEmail}</h2>
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
              {report.map((item) => (
                <tr key={item.donationId}>
                  <td>{item.donationId}</td>
                  <td>{item.description}</td>
                  <td>{item.type}</td>
                  <td>{item.co2Saved}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}><strong>Total CO₂ Saved:</strong></td>
                <td><strong>{totalCO2}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
