"use client";

import React, { useState } from "react";
import "./admin.css"; // make sure this CSS file exists in the same folder

interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "User" | "Suspended";
}

const dummyUsers: User[] = [
  { id: 1, name: "Labib Miah", email: "lab@example.com", role: "Admin" },
  { id: 2, name: "Mobeen M", email: "mobeen@example.com", role: "User" },
  { id: 3, name: "Jane Doe", email: "jane@example.com", role: "Suspended" },
];

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>(dummyUsers);

  const promoteToAdmin = (id: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, role: "Admin" } : user
      )
    );
  };

  const deleteUser = (id: number) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <div className="admin-wrap">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
          <a href="/" className="back-link">← Back to homepage</a>
        </div>
        <div className="header-actions">
          <button className="primary-btn">Settings</button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats">
        <div className="stat">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat">
          <div className="stat-value">{users.filter(u => u.role === "Admin").length}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat">
          <div className="stat-value">{users.filter(u => u.role === "User").length}</div>
          <div className="stat-label">Regular Users</div>
        </div>
        <div className="stat">
          <div className="stat-value">{users.filter(u => u.role === "Suspended").length}</div>
          <div className="stat-label">Suspended</div>
        </div>
      </div>

      {/* User Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td className="space-x-2">
                  {user.role !== "Admin" && (
                    <button
                      className="outline-btn"
                      onClick={() => promoteToAdmin(user.id)}
                    >
                      Promote
                    </button>
                  )}
                  <button
                    className="ghost-btn"
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
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
