"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import"../promote/promote.css";

type User = { User_ID: number; Full_Name: string; Email: string };

export default function PromotePage() {
  const [donors, setDonors] = useState<User[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const donorsRes = await fetch("/api/users/donors");
    const staffRes = await fetch("/api/users/staff");
    setDonors(await donorsRes.json());
    setStaff(await staffRes.json());
    setLoading(false);
  };

 useEffect(() => {
  (async () => {
    await fetchData();
  })();
}, []);


  const promote = async (userId: number) => {
    if (!confirm("Promote donor to staff?")) return;
    const res = await fetch("/api/users/admin/promote-donor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Promotion successful!");
      await fetchData(); // ✅ Refresh donor + staff lists
    } else {
      alert(data.error || "Promotion failed");
    }
  };

  const depromote = async (userId: number) => {
    if (!confirm("Depromote staff to donor?")) return;
    const res = await fetch("/api/users/admin/depromote-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Depromotion successful!");
      await fetchData(); // ✅ Refresh donor + staff lists
    } else {
      alert(data.error || "Depromotion failed");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-wrap">
      <div className="dashboard-bubble">
        {/* Back Button */}
        <div style={{ marginBottom: "16px" }}>
          <Link href="/admin" className="outline-btn">
            ← Back to Dashboard
          </Link>
        </div>

        <h2>Manage Roles</h2>

        <h3>Donors</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((d) => (
              <tr key={d.User_ID}>
                <td>{d.Full_Name}</td>
                <td>{d.Email}</td>
                <td>
                  <button className="primary-btn" onClick={() => promote(d.User_ID)}>
                    Promote
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Staff</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.User_ID}>
                <td>{s.Full_Name}</td>
                <td>{s.Email}</td>
                <td>
                  <button className="primary-btn" onClick={() => depromote(s.User_ID)}>
                    Depromote
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
