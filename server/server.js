
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send(`
    <h1>Welcome to StaffSync</h1>
    <p>Human Resource Management System</p>
    <p>Backend is running successfully!</p>
  `);
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StaffSync API is working!"
  });
});

// Employee schema
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true }
});

const Employee = mongoose.model("Employee", employeeSchema, "employees");

app.post("/api/employees/seed", async (req, res) => {
  try {
    const defaultEmployees = [
      {
        name: "Rahul Sharma",
        department: "Engineering",
        role: "Developer"
      },
      {
        name: "Priya Verma",
        department: "Human Resources",
        role: "HR Executive"
      },
      {
        name: "Aman Patel",
        department: "Finance",
        role: "Accountant"
      }
    ];

    const addedEmployees = [];

    for (const employee of defaultEmployees) {
      const existing = await Employee.findOne({
        name: employee.name
      });

      if (!existing) {
        const added = await Employee.create(employee);
        addedEmployees.push(added);
      }
    }

    res.json({
      success: true,
      message: "Missing employees added. Existing employees preserved.",
      addedCount: addedEmployees.length,
      addedEmployees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// Get employees from MongoDB
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch employees"
    });
  }
});

 // Add a new employee
app.post("/api/employees", async (req, res) => {
  try {
    const { name, department, role } = req.body;

    if (!name?.trim() || !department?.trim() || !role?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, department, and job title are required."
      });
    }

    const employee = await Employee.create({
      name: name.trim(),
      department: department.trim(),
      role: role.trim()
    });

    res.status(201).json({
      success: true,
      message: "Employee added successfully",
      employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Could not add employee"
    });
  }
});

 // Attendance schema
const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Absent"],
    required: true
  }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

// Get attendance records
app.get("/api/attendance", async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 });
    res.json({ success: true, attendance: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark employee attendance
app.post("/api/attendance", async (req, res) => {
  try {
    const { employeeId, date, status } = req.body;

    if (!employeeId || !date || !["Present", "Absent"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Employee, date, and valid status are required."
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date },
      { employeeId, employeeName: employee.name, date, status },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Attendance saved successfully.",
      attendance: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  employeeName: { type: String, required: true },
  leaveType: {
    type: String,
    enum: ["Casual Leave", "Sick Leave", "Earned Leave"],
    required: true
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  }
});

const Leave = mongoose.model("Leave", leaveSchema);

// Get all leave requests
app.get("/api/leaves", async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ _id: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit a leave request
app.post("/api/leaves", async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (
      !employeeId ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all leave request fields."
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date."
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    const leave = await Leave.create({
      employeeId,
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim()
    });

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      leave
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


 app.patch("/api/leaves/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected.",
      });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    res.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully.`,
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected database:", mongoose.connection.name);
    console.log("Employee collection:", Employee.collection.name);
    console.log("MongoDB connected successfully!");
        // Approve or reject a leave request
    app.patch("/api/leaves/:id", async (req, res) => {
      try {
        const { status } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Status must be Approved or Rejected.",
          });
        }

        const leave = await Leave.findByIdAndUpdate(
          req.params.id,
          { status },
          { new: true, runValidators: true }
        );

        if (!leave) {
          return res.status(404).json({
            success: false,
            message: "Leave request not found.",
          });
        }

        res.json({
          success: true,
          message: `Leave request ${status.toLowerCase()} successfully.`,
          leave,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });
    app.listen(PORT, () => {
      console.log(`StaffSync server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

startServer();
