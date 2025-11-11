"use client";


import Link from "next/link";
import "./admin.css";

export default function AdminDashboard() {
  const adminName = "Alice"; // session later

  return (
    <div className="admin-wrap">
      <div className="dashboard-bubble">
        <header className="admin-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <span className="back-link">
              Welcome back, <strong>{adminName}</strong> 👋
            </span>
          </div>
        </header>

        <section className="welcome-section">
          <h2>Welcome back, {adminName}!</h2>
          <p>Manage your system from here:</p>
        </section>

        <div className="grid admin-tools">
          {/* Reports */}
          <div className="card">
            <h3>Reports Overview</h3>
            <p>View sustainability reports submitted by users.</p>
            <Link href="/admin/report" className="primary-btn">Go to Reports</Link>
          </div>

          {/* Create Staff */}
          <div className="card">
            <h3>Create Staff Account</h3>
            <p>Add new staff members to help manage users and sustainability tasks.</p>
            <Link href="/admin/create-staff" className="primary-btn">Create Staff</Link>
          </div>

          {/* Promote Donor */}
          <div className="card">
            <h3>Promote / Depromote</h3>
            <p>Promote donors to staff or depromote staff back to donors.</p>
            <Link href="/admin/promote" className="primary-btn">Manage Roles</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
