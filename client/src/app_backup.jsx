
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/employees";
const ATTENDANCE_API = "http://localhost:5000/api/attendance";

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    department: "",
    role: "",
  });

  async function loadEmployees() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setEmployees(data.employees || []);
      setError("");
    } catch {
      setError("Backend is not running. Please start the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
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
    } catch (err) {
      setFormError(
        err.message || "Could not add employee. Check the backend."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">StaffSync</h2>
        <p className="tagline">Human Resource Management</p>

        <div className="nav-item active">Dashboard</div>
        <div className="nav-item">Employees</div>
        <div className="nav-item">Attendance</div>
        <div className="nav-item">Leave Requests</div>
        <div className="nav-item">Settings</div>

        <div className="sidebar-footer">StaffSync HRMS</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">HUMAN RESOURCES</p>
            <h1>Dashboard</h1>
            <p className="subtitle">
              Welcome back! Here is your workforce overview.
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
            <p>Attendance</p>
            <h2>--</h2>
            <span>Attendance data not connected</span>
          </div>
        </section>

        <section className="employee-section">
          <div className="section-heading">
            <div>
              <h2>Employee Directory</h2>
              <p>View your current employee records.</p>
            </div>

            <div className="employee-actions">
              <span className="count-badge">
                {employees.length} Employees
              </span>
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
          </div>

          {showForm && (
            <form className="employee-form" onSubmit={handleSubmit}>
              <h3>Add New Employee</h3>

              <label>
                Full Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter employee name"
                  required
                />
              </label>

              <label>
                Department
                <input
                  type="text"
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
                  type="text"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
                  placeholder="e.g. Marketing Executive"
                  required
                />
              </label>

              {formError && (
                <p className="message error">{formError}</p>
              )}

              <button className="add-button" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Employee"}
              </button>
            </form>
          )}

          {loading && <p className="message">Loading employees...</p>}
          {error && <p className="message error">{error}</p>}

          {!loading && !error && (
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
                    <tr key={employee.id || employee._id || employee.name}>
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
                      <td>
                        <span className="status">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer>StaffSync HRMS · Employee Management Dashboard</footer>
      </main>
    </div>
  );
}

export default App;
