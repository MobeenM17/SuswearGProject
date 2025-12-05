"use client";
import React, { useEffect, useState } from "react";
import "./report.css"; // this links the report css to this page

// this stores Donor data 
type Donor = {
  User_ID: number;
  Full_Name: string;
  Email: string;
};

// this is used to store each data for the report data
type ReportItem = {
  donationId: number;
  description: string;
  category: string;
  co2Saved: number;
};

export default function ReportPage() {
  
  //use to store the data and set data aswell - also used to show error messages / loading process - and hide the report aswell
  const [donors, setDonors] = useState<Donor[]>([]); 
  const [selectedEmail, setSelectedEmail] = useState<string>(""); 
  const [rows, setRows] = useState<ReportItem[]>([]); 
  const [totalDonation, setTotalDonation] = useState<number>(0); 
  const [totalCO2, setTotalCO2] = useState<number>(0); 
  const [landfillSaved, setLandfillSaved] = useState<number>(0); 
  const [loading, setLoading] = useState<boolean>(false); 
  const [error, setError] = useState<string>(""); 
  const [generated, setGenerated] = useState<boolean>(false); 
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/donors"); // this gets all the back end data
        if (!res.ok) throw new Error("Failed to load donors."); // shows an error if it cant get the back end data
        const data: Donor[] = await res.json(); // gets the backend data into JSON
        setDonors(data); // stores donor data
      } 
      catch (e) 
      {
        console.error(e);
        setError("Could not load donors from the database."); // Display simple error
      }
    })();
  }, []);

  function generateReportText(): string { // this generates the report text file for download
  if (rows.length > 0) {// if the rows length is more than 0 it means its a
    // donor-specific report
    let txt = `Donor Report for: ${selectedEmail}\n\n`; // report header
    rows.forEach((r) => {
      txt += `Donation ID: ${r.donationId}\n`; // each donation details to add to the text file
      txt += `Description: ${r.description}\n`;
      txt += `Category: ${r.category}\n`;
      txt += `CO2 Saved: ${r.co2Saved} kg\n\n`;
    });

    txt += `TOTAL CO2 SAVED: ${totalCO2} kg\n`;
    txt += `TOTAL LANDFILL SAVED: ${landfillSaved} kg\n`;

    return txt;
  }

  // global report
  return (
    `GLOBAL SUMMARY REPORT\n\n` + // report header
    `Total Donations: ${totalDonation}\n` + // total donations
    `Total CO2 Saved: ${totalCO2} kg\n` + // total co2 saved
    `Landfill Saved: ${landfillSaved} kg\n` // total landfill saved
  );
}

function handleDownload(): void { // this handles the download report button feature via the method of creating a blob and link to download the file
  const text = generateReportText(); // gets the report text for the report file 
  const blob = new Blob([text], { type: "text/plain" }); // creates a blob object with the text data
  const url = URL.createObjectURL(blob); // creates a URL for the blob object

  const link = document.createElement("a"); // creates a link element 
  link.href = url; // sets the href attribute of the link to the blob URL
  link.download = "report.txt"; // sets the download attribute with the filename
  link.click(); // programmatically clicks the link to trigger the download

  URL.revokeObjectURL(url);
}

  async function handleGenerate() {
    // this clears the error message and shows the loading data 
    setError(""); 
    setGenerated(false); 
    setLoading(true); 

    try {
      // this send the donor email/null for all donors to the database
      const res = await fetch("/api/reports/co2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorEmail: selectedEmail || null }),
      });
      if (!res.ok) {
        const problem = await res.json().catch(() => ({}));
        setError(problem.error || "Error generating report."); //error message incase server ran into an issue
        return;
      }
      // Convert response into usable data
      const data = await res.json();

      // this shows the all the donors total landfill + co2
      if (data.scope === "all") {
        
        setTotalDonation(data.totalDonations ?? 0);
        setTotalCO2(data.totalCO2);
        setLandfillSaved(data.landfillSavedKG);
        setRows([]); // this clears the table rows as there no tables needing to show donors
      } 
      else 
      {
        // individual donor contribution
        setTotalDonation(data.totalCO2 ?? 0);
        setTotalCO2(data.totalCO2);
        setLandfillSaved(data.landfillSavedKG);
        const items: ReportItem[] = (data.donations || []).map((d: 
          {
          donationId: number; //gets the donation id
          description: string; //gets the description
          type: string; //gets type data
          co2Saved: number; //gets co2 data
        }
      ) => ({
          donationId: d.donationId, //assigns it to the table row
          description: d.description,
          category: d.type,
          co2Saved: d.co2Saved,
        }));
        setRows(items); //stores it in the set rows so it can be filled out
      }

      setGenerated(true); // Show thes results
    } 
    catch (e) 
    {
      console.error(e);
      setError("The was an network error when generating report error."); // if there was an error for generating a report shows this.
    } 
    finally //runs after all process is done at the end
    {
      setLoading(false); // gets rid of the generated data.
    }
  }

  return (

    <div className="report-container">
      <div className="report-header">
        <h1>CO2 Emissions Report</h1>
        <a className="back-link" href="/admin">
          Back to Dashboard
        </a>
      </div>

      {/* drop down for donors */}
      <div className="select-data">
        <select className="dropdown"  value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}>
          <option value="">All Data</option> {/* this is the first option and is the default option that shows all the total donor data*/}
          {/* shows all the donor from the database */}
          {donors.map((d) => (
            <option key={d.User_ID} value={d.Email}>{d.Full_Name}({d.Email})</option>
          ))}
        </select>
        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>
      {error && <p className="error">{error}</p>} {/* display error message incase any message */}
      {/* shows the report after admin click generates */}
      {generated && (
        <div className="report-output">
          <button className="download-btn" onClick={handleDownload}> {/* this is the Download report button feature*/}
            Download Report
          </button>
                {/* if admin click a donor and click generate report shows the first message / if user didnt click a donor and clicks total - displays the global*/}
          <h2> {selectedEmail? `The Donor Report for: ${selectedEmail}`: "Global CO2 and Landfill Summary"}</h2> 
          {rows.length > 0 ? (
            <table className="report-table">
              <thead><tr>
                  <th>Donation ID</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>CO2 Saved (kg)</th>
                </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.donationId}>
                    <td>{r.donationId}</td>
                    <td>{r.description}</td>
                    <td>{r.category}</td>
                    <td>{r.co2Saved}</td>
                  </tr>
                ))}
                <tr><td colSpan={3}>
                    <strong>Total CO2 Saved:</strong>
                  </td><td>
                    <strong>{totalCO2}</strong>
                  </td></tr>
              </tbody></table>
          ) : (
            // shows the global total report
            <div className="summary-box">
              {/* shows total donation - gets the data and shows it here*/}
              <p><strong>Total Donations:</strong> {totalDonation}</p> 
             {/* shows total co2 saved - gets the data and shows it here*/}
              <p><strong>Total CO2 Saved (in kg):</strong> {totalCO2} kg</p> 
              {/* shows landfill saved - gets the data and shows it here*/}
              <p><strong>Landfill Saved (in kg):</strong> {landfillSaved} kg</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
