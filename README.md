# 🤖 RoboTrack Pro — STEM & Robotics Multi-School Academy Operations Suite

A high-tech operations, curriculum tracking, and financial management platform for robotics education providers managing multiple schools and instructor teams.

![RoboTrack Pro Logo](public/logo.jpg)

---

## 🌟 Key Highlights & Features

### 📍 1. Location-Restricted Geofenced Check-In & Check-Out
- **Haversine Geofencing Engine:** Automatically verifies instructors' live GPS coordinates against school campus boundaries.
- **Strict Perimeter Enforcement:** Check-in is permitted **only** when within the school's configured geofence radius (e.g. 200m – 300m). Attempts outside the perimeter are flagged and blocked.
- **Real-Time Interactive GPS Map:** Powered by Leaflet with glowing geofence boundaries, real-time distance gauge, and device pinpointing.
- **GPS Testing Preset Bar:** Quick testing toolbar (`Inside Lab ~35m`, `School Gate ~160m`, `Outside ~850m [Blocked]`, `Far Away ~2.8km [Rejected]`, and `Real Browser GPS`) for instant demonstration on mobile or desktop.
- **Active Session Timer:** Live running counter with timestamp recording and GPS accuracy metric.

### 🤖 2. Robotics Curriculum & Session Topic Tracking
- **8 Standardized Modules:** Foundations of Electronics, Microcontroller Programming (Arduino Uno IDE), Sensors & Perception, Motors/Drivers & Actuators, Autonomous Wheeled Rovers, Wireless Telemetry & IoT (ESP32/Bluetooth), Articulated Arms & Kinematics, and AI Computer Vision.
- **Session Register:** Comprehensive log capturing Topic Taught, School Visited, Instructor, Grade/Batch, Hours Spent, Hardware Kits Used, Student Attendance, and Practical Notes.
- **School Syllabus Progression:** Track which campus has reached which robotics module and lesson.

### 💰 3. Financial, Advance Payment & Travel Expense Management
- **Hourly Pay Engine:** Configurable teacher hourly rates (e.g., ₹750/hr / $30/hr) with automatic gross earnings calculation from verified session hours.
- **Advance Payment Tracker:** Complete recording of advance payments disbursed to instructors (Bank Transfer / UPI / Cash) with running balance and auto-deduction during payroll settlement.
- **Travel & Equipment Transport Claims:** Per-visit flat allowance or distance-based reimbursement (`km × rate`) for carrying heavy robotics kits, complete with Admin approval workflows.
- **Net Pending Salary Formula:**
  $$\text{Net Pending Salary} = (\text{Gross Earned Session Pay} + \text{Approved Travel}) - \text{Total Advances Paid} - \text{Prior Settled Salary}$$
- **Official Pay Slip & Voucher:** Printable, formal salary voucher with itemized breakdowns, school visit allowances, advance deductions, and signature sections.

### 🏫 4. Multi-Campus Partner Schools Directory (12 Schools)
- Pre-configured with 12 partner schools with exact coordinates, geofence radius, academic contacts, scheduled days/time slots, student counts, and hardware allocations.
- Multi-campus fleet overview map displaying all school zones simultaneously.

### 👥 5. Instructor / Staff Management
- Instructor profiles (Alex Morgan, Priya Sharma, and extensible to more).
- Assigned schools, specialization kits, hourly wage configuration, and lifetime teaching performance metrics.

### 🛰️ 6. Location Audit Trail & Attempt Inspector
- Complete audit trail logging every check-in and check-out attempt (both verified on-site and out-of-range rejections).
- Captures device latitude/longitude, school perimeter, deviation distance, timestamp, and device user-agent.
- **Inspect on Map:** Visual modal popup rendering the teacher's exact attempt point relative to the school geofence circle.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd robotics-academy-tracker

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Project Architecture

```
robotics-academy-tracker/
├── index.html                   # HTML entry with Google Fonts & Leaflet
├── package.json                 # Project dependencies & scripts
├── public/
│   ├── favicon.svg
│   └── logo.jpg                 # Futuristic RoboTrack brand logo
└── src/
    ├── main.js                  # App orchestrator, router & state manager
    ├── style.css                # Glassmorphic dark/light UI design system
    ├── data/
    │   └── mockData.js          # Preloaded data (2 teachers, 12 schools, curriculum, history)
    ├── utils/
    │   ├── geo.js               # Haversine distance, geofencing & simulator
    │   └── storage.js           # LocalStorage state, payroll engine & CSV exports
    └── components/
        ├── Header.js            # Top bar, role switcher, theme & currency toggles
        ├── DashboardView.js     # KPI metrics, live session banner & quick schedule
        ├── CheckInOutView.js    # Geofenced check-in/out engine & interactive map
        ├── SessionsCurriculumView.js # Session history & 8-module robotics syllabus
        ├── FinanceView.js       # Salary ledger, advance tracker & printable payslips
        ├── SchoolsView.js       # 12 schools directory & multi-campus map
        ├── StaffView.js         # Teacher profiles & wage settings
        └── AuditLogView.js      # GPS attempt audit trail & location inspector
```

---

## 📄 License
MIT License. Created for Robotics STEM Academies & Multi-School Education Providers.
