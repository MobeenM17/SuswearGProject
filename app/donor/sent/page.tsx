"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SentDonation = {
  Donation_ID: number;
  Description: string;
  WeightKg: number | null;
  Tracking: string;
  Submitted_At: string;
  Status: string;
  Inventory_Status?: "Arriving" | "InStock" | null;
};

export default function SentDonations() {
  const router = useRouter();
  const [donations, setDonations] = useState<SentDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load sent donations
  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await fetch("/api/donations/list-sent", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load sent donations");
        }
        const data: SentDonation[] = await res.json();
        setDonations(data);
      } catch (e: Error | unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // this handles a donation to being sent to the warehouse
  const handleSend = async (donationId: number) => {
    const confirmed = confirm(
      "Have you posted this item to our local warehouse?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/donations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      // update local donation Inventory_Status to InStock
      setDonations((prev) =>
        prev.map((d) =>
          d.Donation_ID === donationId
            ? { ...d, Inventory_Status: "InStock" }
            : d
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="donor-wrap Main-ContainerBox">
      <header className="donor-header">
        <h1>Sent Donations</h1>
        <button onClick={() => router.push("/donor")} className="outline-btn">
          ← Back to Dashboard
        </button>
      </header>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading sent donations…</p>
      ) : donations.length === 0 ? (
        <p className="muted">You haven’t had any accepted donations yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Weight (kg)</th>
                <th>Tracking Number</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.Donation_ID}>
                  <td>{d.Donation_ID}</td>
                  <td>{d.Description}</td>
                  <td>{d.WeightKg?.toFixed(1) ?? "-"}</td>
                  <td>{d.Tracking}</td>
                  <td>{new Date(d.Submitted_At).toLocaleDateString()}</td>
                  <td>
                    {d.Inventory_Status === "Arriving" ? (
                      <button
                        className="primary-btn"
                        onClick={() => handleSend(d.Donation_ID)}
                      >
                        Send
                      </button>
                    ) : (
                      <span className="muted">Sent</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
