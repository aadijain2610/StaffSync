
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/employees";
const ATTENDANCE_API = "http://localhost:5000/api/attendance";
const LEAVE_API = "http://localhost:5000/api/leaves";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [form, setForm] = useState({
    name: "",
    department: "",
    role: "",
  });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [status, setStatus] = useState("Present");

  async function loadEmployees() {
    const response = await fetch(API);
    if (!response.ok) throw new Error("Could not load employees.");
    const data = await response.json();
    setEmployees(data.employees || []);
  }

  async function loadAttendance() {
    const response = await fetch(ATTENDANCE_API);
    if (!response.ok) throw new Error("Could not load attendance.");
    const data = await response.json();
    setAttendance(data.attendance || []);
  }
async function loadLeaves() {
  const response = await fetch(LEAVE_API);

  if (!response.ok) {
    throw new Error("Could not load leave requests.");
  }

  const data = await response.json();
  setLeaves(data.leaves || []);
}
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      await loadEmployees();
      await loadAttendance();
      await loadLeaves();
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Could not add employee.");
      }

      setForm({ name: "", department: "", role: "" });
      setShowForm(false);
      await loadEmployees();
      setNotice("Employee added successfully.");
    } catch (err) {
      setFormError(err.message || "Could not add employee.");
    } finally {
      setSaving(false);
    }
  }

  async function markAttendance(event) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setFormError("");

    try {
      const response = await fetch(ATTENDANCE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          date,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save attendance.");
      }

      await loadAttendance();
      setNotice("Attendance saved successfully!");
    } catch (err) {
      setFormError(err.message || "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  const todayRecords = attendance.filter((record) => record.date === date);
  const presentCount = todayRecords.filter(
    (record) => record.status === "Present"
  ).length;
  const absentCount = todayRecords.filter(
    (record) => record.status === "Absent"
  ).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">StaffSync</h2>
        <p className="tagline">Human Resource Management</p>

        {["Dashboard", "Employees", "Attendance", "Leave Requests", "Settings"].map(
          (item) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${page === item ? "active" : ""}`}
              onClick={() => {
                setPage(item);
                setNotice("");
                setFormError("");
                if (item === "Attendance") loadData();
              }}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              {item}
            </button>
          )
        )}

        <div className="sidebar-footer">StaffSync HRMS</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">HUMAN RESOURCES</p>
            <h1>{page}</h1>
            <p className="subtitle">
              {page === "Attendance"
                ? "Manage daily employee attendance."
                : "Welcome back! Here is your workforce overview."}
            </p>
          </div>
          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin</strong>
              <p>HR Administrator</p>
            </div>
          </div>
        </header>

        {loading && <p className="message">Loading data...</p>}
        {error && <p className="message error">{error}</p>}
        {notice && <p className="message">{notice}</p>}

        {!loading && !error && page === "Dashboard" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <p>Total Employees</p>
                <h2>{employees.length}</h2>
                <span>Registered employees</span>
              </div>
              <div className="stat-card">
                <p>Departments</p>
                <h2>
                  {new Set(employees.map((employee) => employee.department)).size}
                </h2>
                <span>Across the organization</span>
              </div>
              <div className="stat-card">
                <p>Present on selected date</p>
                <h2>{presentCount}</h2>
                <span>{date}</span>
              </div>
            </section>

            <section className="employee-section">
              <div className="section-heading">
                <div>
                  <h2>Employee Directory</h2>
                  <p>View your current employee records.</p>
                </div>
                <button
                  className="add-button"
                  onClick={() => {
                    setFormError("");
                    setShowForm(!showForm);
                  }}
                >
                  {showForm ? "Cancel" : "+ Add Employee"}
                </button>
              </div>

              {showForm && (
                <form className="employee-form" onSubmit={handleSubmit}>
                  <h3>Add New Employee</h3>
                  <label>
                    Full Name
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter employee name"
                      required
                    />
                  </label>
                  <label>
                    Department
                    <input
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                      placeholder="e.g. Marketing"
                      required
                    />
                  </label>
                  <label>
                    Job Title
                    <input
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="e.g. Developer"
                      required
                    />
                  </label>
                  {formError && <p className="message error">{formError}</p>}
                  <button className="add-button" disabled={saving}>
                    {saving ? "Saving..." : "Save Employee"}
                  </button>
                </form>
              )}

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
                      <th>DEPARTMENT</th>
                      <th>JOB TITLE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee._id || employee.id || employee.name}>
                        <td>
                          <div className="employee-name">
                            <div className="employee-avatar">
                              {employee.name?.trim().charAt(0)?.toUpperCase()}
                            </div>
                            <strong>{employee.name}</strong>
                          </div>
                        </td>
                        <td>{employee.department}</td>
                        <td>{employee.role}</td>
                        <td><span className="status">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {!loading && !error && page === "Employees" && (
          <section className="employee-section">
            <h2>Employees</h2>
            <p>Total registered employees: {employees.length}</p>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Department</th><th>Job Title</th></tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id}>
                      <td>{employee.name}</td>
                      <td>{employee.department}</td>
                      <td>{employee.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && !error && page === "Attendance" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <p>Employees</p><h2>{employees.length}</h2>
                <span>Total registered</span>
              </div>
              <div className="stat-card">
                <p>Present</p><h2>{presentCount}</h2>
                <span>On selected date</span>
              </div>
              <div className="stat-card">
                <p>Absent</p><h2>{absentCount}</h2>
                <span>On selected date</span>
              </div>
            </section>

            <section className="employee-section">
              <div className="section-heading">
                <div>
                  <h2>Mark Attendance</h2>
                  <p>Choose an employee, date and status.</p>
                </div>
              </div>

              <form className="employee-form" onSubmit={markAttendance}>
                <label>
                  Attendance Date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Employee
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name} — {employee.department}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </label>

                {formError && <p className="message error">{formError}</p>}
                <button className="add-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </form>
            </section>

            <section className="employee-section">
              <h2>Attendance Records</h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Employee</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {todayRecords.map((record) => (
                      <tr key={record._id}>
                        <td>{record.employeeName}</td>
                        <td>{record.date}</td>
                        <td>
                          <span className="status">{record.status}</span>
                        </td>
                      </tr>
                    ))}
                    {todayRecords.length === 0 && (
                      <tr>
                        <td colSpan="3">No attendance recorded for this date.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        
        {!loading && !error && page === "Leave Requests" && (
          <section className="employee-section">
            <h2>Leave Requests</h2>
            <p>Apply for leave and track your request.</p>
            <div style={{ marginTop: "30px" }}>
  <h3>Submitted Leave Requests</h3>

  {leaves.length === 0 ? (
    <p>No leave requests found.</p>
  ) : (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", marginTop: "15px" }}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {leaves.map((leave) => (
            <tr key={leave._id}>
              <td>{leave.employeeName}</td>
              <td>{leave.leaveType}</td>
              <td>{leave.startDate}</td>
              <td>{leave.endDate}</td>
              <td>{leave.reason}</td>
             <td>
  <span className="status">{leave.status}</span>

  {leave.status === "Pending" && (
    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
      <button
        type="button"
        onClick={async () => {
          try {
            const response = await fetch(`${LEAVE_API}/${leave._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "Approved" }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Could not approve leave.");
            }

            await loadLeaves();
            alert("Leave approved successfully!");
          } catch (err) {
            alert(err.message);
          }
        }}
      >
        Approve
      </button>

      <button
        type="button"
        onClick={async () => {
          try {
            const response = await fetch(`${LEAVE_API}/${leave._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "Rejected" }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Could not reject leave.");
            }

            await loadLeaves();
            alert("Leave rejected successfully!");
          } catch (err) {
            alert(err.message);
          }
        }}
      >
        Reject
      </button>
    </div>
  )}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

            <form
             onSubmit={async (e) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);

  const leaveData = {
    employeeId: formData.get("employeeId"),
    leaveType: formData.get("leaveType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
  };

  try {
    const response = await fetch(LEAVE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leaveData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not submit leave request.");
    }

    alert("Leave request submitted successfully!");
    e.currentTarget.reset();
    await loadLeaves();
  } catch (err) {
    alert(err.message || "Could not submit leave request.");
  }
}}
              style={{
                display: "grid",
                gap: "12px",
                maxWidth: "500px",
                marginTop: "20px"
              }}
            >
              <label>
                Employee Name
                <select
  name="employeeId"
  required
  defaultValue=""
  style={{
    display: "block",
    width: "100%",
    padding: "10px",
    marginTop: "5px",
  }}
>
                  <option value="" disabled>Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id || employee.id} value={employee._id || employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Leave Type
               <select
  name="leaveType"
  required
  defaultValue=""
  style={{
    display: "block",
    width: "100%",
    padding: "10px",
    marginTop: "5px",
  }}
>
                  <option value="" disabled>Select leave type</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                </select>
              </label>

              <label>
                Start Date
                <input type="date" name="startDate"  required style={{ display: "block", width: "100%", padding: "10px", marginTop: "5px" }} />
              </label>

              <label>
                End Date
                <input
  type="date"
  name="endDate"
  required
  style={{
    display: "block",
    width: "100%",
    padding: "10px",
    marginTop: "5px",
  }}
/>
              </label>

              <label>
                Reason for Leave
                <textarea name="reason"required placeholder="Enter reason for leave" rows="3" style={{ display: "block", width: "100%", padding: "10px", marginTop: "5px" }} />
              </label>

              <button type="submit">Submit Leave Request</button>
            </form>
          </section>
        )}


        {!loading && !error && page === "Settings" && (
          <section className="employee-section">
            <h2>Settings</h2>
            <p>StaffSync HRMS settings.</p>
          </section>
        )}

        <footer>StaffSync HRMS · Employee Management Dashboard</footer>
      </main>
    </div>
  );
}

export default App;
