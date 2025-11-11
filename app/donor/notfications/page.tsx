"use client";
import { useEffect, useState } from "react";
import styles from "./notifications.module.css";

type NotificationRow = {
  Notification_ID: number;
  Donation_ID: number;
  Status: string;
  Generated_At: string;
};

export default function DonorNotifications() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b?.error || "Failed to load notifications");
        }
        const data: NotificationRow[] = await res.json();
        setRows(data);
      } catch (e: any) {
        setError(e?.message || "Error loading notifications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <div className={styles.left}>
          <h1>Notifications</h1>
          <a href="/donor" className={styles.backLink}>← Back to dashboard</a>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading...</p>
      ) : rows.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <section className={styles.card}>
          <h2>Your Notifications</h2>
          <ul className={styles.list}>
            {rows.map((n) => (
              <li key={n.Notification_ID} className={styles.item}>
                <div className={styles.itemTop}>
                  <strong>Donation #{n.Donation_ID}</strong>
                  <span
                    className={
                      n.Status === "Accepted"
                        ? styles.badgeAccepted
                        : styles.badgeRejected
                    }
                  >
                    {n.Status}
                  </span>
                </div>
                <div className={styles.itemBottom}>
                  <small>
                    {new Date(n.Generated_At).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
