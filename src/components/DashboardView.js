// Executive Operations Dashboard for RoboTrack Pro

import {
  getStaff,
  getSchools,
  getSessions,
  getAdvances,
  getTravelExpenses,
  getSalaryPayments,
  getKits,
  calculateStaffFinancials,
  formatCurrency,
  getActiveSession
} from "../utils/storage.js";

export function renderDashboardView(state) {
  const staffList = getStaff();
  const schoolList = getSchools();
  const sessions = getSessions();
  const advances = getAdvances();
  const travelList = getTravelExpenses();
  const kits = getKits();

  const isAdmin = state.currentUser?.role === "admin";
  const isStaff = state.currentUser?.role === "staff";
  const isSchool = state.currentUser?.role === "school";

  // Aggregate stats
  const totalHours = sessions.reduce((acc, s) => acc + (Number(s.hours) || 0), 0);
  const totalSessionsCount = sessions.length;
  const activeSchoolsCount = schoolList.length;
  const totalDeployedKits = kits.reduce((acc, k) => acc + (k.deployedCount || 0) + (k.inTransitCount || 0), 0);
  const totalStudentsTrained = schoolList.reduce((acc, sch) => acc + (Number(sch.studentCount) || 0), 0);

  let totalGrossEarned = 0;
  let totalAdvancesPaid = 0;
  let totalApprovedTravel = 0;
  let totalNetPendingSalary = 0;

  if (isAdmin) {
    staffList.forEach((s) => {
      const fin = calculateStaffFinancials(s.id);
      if (fin) {
        totalGrossEarned += fin.earnedSalary;
        totalAdvancesPaid += fin.totalAdvancesPaid;
        totalApprovedTravel += fin.totalTravelAllowance;
        totalNetPendingSalary += fin.netPendingSalary;
      }
    });
  }

  // Current user's active session if checked in
  const currentStaffId = state.currentUserRole === "admin" ? staffList[0].id : state.currentUserId;
  const activeSession = getActiveSession(currentStaffId);

  // Today's scheduled visits (day of week)
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDay = daysOfWeek[new Date().getDay()];

  const scheduledToday = schoolList.filter((sch) =>
    sch.scheduleDays.some((d) => d.toLowerCase() === todayDay.toLowerCase())
  );

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>📊 Robotics Academy Control Center</h2>
        <p>Operational overview across 12 partner schools & 2 lead robotics mentors</p>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="quick-checkin-nav-btn" class="btn btn-primary">
          📍 Quick Check-In
        </button>
        ${
          isAdmin
            ? `
        <button id="export-payroll-btn" class="btn btn-secondary">
          📑 Export Payroll CSV
        </button>
        `
            : ""
        }
      </div>
    </div>

    <!-- Active Live Check-in Banner if currently checked in -->
    ${
      activeSession
        ? `
      <div class="active-session-banner">
        <div>
          <div class="session-live-pulse">
            <span class="pulse-dot"></span>
            ACTIVE SESSION IN PROGRESS
          </div>
          <h3>${activeSession.schoolName}</h3>
          <div class="active-session-details">
            <span>👨‍🏫 Teacher: <strong>${activeSession.staffName}</strong></span>
            <span>⏰ Checked In: <strong>${activeSession.checkInTime}</strong></span>
            <span>🎯 Geofence: <strong>Verified within ${activeSession.geofenceRadius}m</strong></span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="session-timer-badge" id="live-dashboard-timer">
            ⏱️ <span id="dash-timer-display">Calculating...</span>
          </div>
          <button id="dash-checkout-btn" class="btn btn-warning">
            🏁 Check-Out & Submit Topic
          </button>
        </div>
      </div>
    `
        : ""
    }

    <!-- KPI Cards Grid -->
    <div class="kpi-grid">
      <div class="kpi-card" style="--card-accent: var(--cyan-primary);">
        <div class="kpi-header">
          <span class="kpi-title">Total Sessions</span>
          <div class="kpi-icon" style="color: var(--cyan-primary);">🤖</div>
        </div>
        <div class="kpi-value">${totalSessionsCount}</div>
        <div class="kpi-subtext">Verified robotics sessions across all schools</div>
      </div>

      <div class="kpi-card" style="--card-accent: var(--indigo-primary);">
        <div class="kpi-header">
          <span class="kpi-title">Teaching Hours</span>
          <div class="kpi-icon" style="color: var(--indigo-primary);">⏱️</div>
        </div>
        <div class="kpi-value">${totalHours.toFixed(1)} <span style="font-size: 1rem; font-weight: 500;">hrs</span></div>
        <div class="kpi-subtext">Avg 3.2 hrs per practical robotics batch</div>
      </div>

      <div class="kpi-card" style="--card-accent: var(--emerald-primary);">
        <div class="kpi-header">
          <span class="kpi-title">Active Schools</span>
          <div class="kpi-icon" style="color: var(--emerald-primary);">🏫</div>
        </div>
        <div class="kpi-value">${activeSchoolsCount}</div>
        <div class="kpi-subtext">With defined GPS geofenced coordinates</div>
      </div>

      ${
        isAdmin
          ? `
      <div class="kpi-card" style="--card-accent: var(--amber-primary);">
        <div class="kpi-header">
          <span class="kpi-title">Advances Paid Out</span>
          <div class="kpi-icon" style="color: var(--amber-primary);">💳</div>
        </div>
        <div class="kpi-value" style="color: var(--amber-primary);">${formatCurrency(totalAdvancesPaid)}</div>
        <div class="kpi-subtext">Total advance payments disbursed to staff</div>
      </div>

      <div class="kpi-card" style="--card-accent: var(--cyan-primary);">
        <div class="kpi-header">
          <span class="kpi-title">Approved Travel</span>
          <div class="kpi-icon" style="color: var(--cyan-primary);">🚗</div>
        </div>
        <div class="kpi-value">${formatCurrency(totalApprovedTravel)}</div>
        <div class="kpi-subtext">Kit transport & visit allowances</div>
      </div>

      <div class="kpi-card" style="--card-accent: #00F0FF;">
        <div class="kpi-header">
          <span class="kpi-title">Net Pending Salary</span>
          <div class="kpi-icon" style="color: #00F0FF;">💰</div>
        </div>
        <div class="kpi-value" style="color: #00F0FF;">${formatCurrency(totalNetPendingSalary)}</div>
        <div class="kpi-subtext">Earned + Travel minus Advances Paid</div>
      </div>
      `
          : `
      <div class="kpi-card" style="--card-accent: var(--amber-primary);">
        <div class="kpi-header">
          <span class="kpi-title">Deployed Kits</span>
          <div class="kpi-icon" style="color: var(--amber-primary);">📦</div>
        </div>
        <div class="kpi-value" style="color: var(--amber-primary);">${totalDeployedKits} <span style="font-size: 1rem; font-weight: 500;">kits</span></div>
        <div class="kpi-subtext">Active robotics hardware kits on school campuses</div>
      </div>

      <div class="kpi-card" style="--card-accent: var(--cyan-primary);">
        <div class="kpi-header">
          <span class="kpi-title">Enrolled Students</span>
          <div class="kpi-icon" style="color: var(--cyan-primary);">🎓</div>
        </div>
        <div class="kpi-value">${totalStudentsTrained}</div>
        <div class="kpi-subtext">Active students across all practical batches</div>
      </div>

      <div class="kpi-card" style="--card-accent: #00F0FF;">
        <div class="kpi-header">
          <span class="kpi-title">Curriculum Scope</span>
          <div class="kpi-icon" style="color: #00F0FF;">📚</div>
        </div>
        <div class="kpi-value" style="color: #00F0FF;">8 Modules</div>
        <div class="kpi-subtext">Robotics, Microcontrollers, IoT & AI Perception</div>
      </div>
      `
      }
    </div>

    <!-- 2 Column Section: Today's Schedule & Teacher Summary -->
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.75rem;">
      
      <!-- Today's Scheduled Visits -->
      <div class="panel-card">
        <div class="panel-card-title">
          <h3>📅 Today's Robotics Schedule (${todayDay})</h3>
          <span class="status-badge badge-info">${scheduledToday.length} Schools Scheduled</span>
        </div>

        ${
          scheduledToday.length === 0
            ? `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No regular classes scheduled for today. Check upcoming days or conduct special sessions!</div>`
            : `
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${scheduledToday
              .map((sch) => {
                const assignedStaff = staffList.find((st) => sch.assignedTeachers.includes(st.id));
                const teacherName = assignedStaff ? assignedStaff.name : "Unassigned";
                return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                  <div>
                    <h4 style="font-size: 1rem; margin-bottom: 0.2rem;">${sch.name}</h4>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; gap: 0.8rem;">
                      <span>🕒 ${sch.preferredTime}</span>
                      <span>👨‍🏫 ${teacherName}</span>
                      <span>🎯 Radius: ${sch.geofenceRadius}m</span>
                    </div>
                  </div>
                  <button class="btn btn-outline-cyan btn-sm schedule-checkin-btn" data-school="${sch.id}">
                    Check In Here
                  </button>
                </div>
              `;
              })
              .join("")}
          </div>
        `
        }
      </div>

      <!-- Right Column: Staff Payroll Summary (Admin Only) OR Faculty / Campus Overview (Staff & School) -->
      ${
        isAdmin
          ? `
      <div class="panel-card">
        <div class="panel-card-title">
          <h3>👥 Staff Payroll & Advance Summary</h3>
          <button id="view-finance-tab-btn" class="btn btn-secondary btn-sm">Full Ledger →</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${staffList
            .map((staff) => {
              const fin = calculateStaffFinancials(staff.id);
              return `
              <div style="padding: 1rem; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.5rem;">${staff.avatar}</span>
                    <div>
                      <strong style="font-size: 0.95rem;">${staff.name}</strong>
                      <div style="font-size: 0.76rem; color: var(--text-muted);">${staff.role} • ${fin.rateFormatted}</div>
                    </div>
                  </div>
                  <span class="status-badge ${fin.wageType === "monthly" ? "badge-verified" : fin.wageType === "daily" ? "badge-warning" : "badge-info"}" style="font-size: 0.72rem;">
                    ${fin.wageType === "monthly" ? "📅 Monthly" : fin.wageType === "daily" ? "📆 Daily" : "⏱️ Hourly"}
                  </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: var(--radius-sm); font-size: 0.8rem; text-align: center;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">${fin.wageType === "daily" ? "DAYS" : "HOURS"}</div>
                    <strong>${fin.wageType === "daily" ? `${fin.workingDays} days` : `${fin.totalHours} hrs`}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">ADVANCE PAID</div>
                    <strong style="color: var(--amber-primary);">${formatCurrency(fin.totalAdvancesPaid)}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">PENDING DUE</div>
                    <strong style="color: #00F0FF;">${formatCurrency(fin.netPendingSalary)}</strong>
                  </div>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
      `
          : `
      <div class="panel-card">
        <div class="panel-card-title">
          <h3>${isStaff ? "👨‍🏫 My Faculty Profile & Teaching Overview" : "🏫 Campus Robotics Program Overview"}</h3>
          <span class="status-badge badge-verified">Active Faculty</span>
        </div>

        ${
          isStaff
            ? (() => {
                const myStaff = staffList.find((s) => s.id === state.currentUser?.id) || staffList[0];
                const mySessions = sessions.filter((s) => s.staffId === myStaff.id);
                const myHours = mySessions.reduce((acc, s) => acc + (Number(s.hours) || 0), 0);
                return `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="padding: 1.15rem; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.85rem;">
                  <span style="font-size: 2.4rem;">${myStaff.avatar || "👨‍🏫"}</span>
                  <div>
                    <h4 style="font-size: 1.15rem; margin-bottom: 0.2rem;">${myStaff.name}</h4>
                    <div style="font-size: 0.82rem; color: var(--text-secondary);">${myStaff.role}</div>
                    <div style="font-size: 0.76rem; color: var(--cyan-primary); margin-top: 0.2rem;">🛠️ ${myStaff.specialty}</div>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: rgba(255,255,255,0.03); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.82rem; text-align: center;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">SESSIONS</div>
                    <strong style="color: var(--cyan-primary); font-size: 1.1rem;">${mySessions.length}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">TEACHING TIME</div>
                    <strong style="color: var(--emerald-primary); font-size: 1.1rem;">${myHours.toFixed(1)} hrs</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">CAMPUSES</div>
                    <strong style="font-size: 1.1rem;">${myStaff.assignedSchools.length}</strong>
                  </div>
                </div>
              </div>

              <div style="font-size: 0.8rem; color: var(--text-muted); background: rgba(0,240,255,0.05); border: 1px solid rgba(0,240,255,0.15); padding: 0.75rem; border-radius: var(--radius-sm);">
                📍 <strong>Tip:</strong> Always check in using the Geofenced Check-In tab upon arrival at partner schools to log verified sessions.
              </div>
            </div>
            `;
              })()
            : `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              <div style="padding: 1.25rem; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.88rem; line-height: 1.8;">
                <div>🏫 <strong>Institution:</strong> ${state.currentUser?.schoolName || "Partner Campus"}</div>
                <div>👨‍🏫 <strong>Lead Mentors:</strong> 2 Certified Robotics Specialists Assigned</div>
                <div>🤖 <strong>Lab Framework:</strong> Practical Hands-on Robotics & Microcontrollers</div>
                <div>🎯 <strong>GPS Verification:</strong> Live On-Premises Geofencing Active</div>
              </div>
            </div>
          `
        }
      </div>
      `
      }
    </div>

    <!-- Recent Session Activity -->
    <div class="table-card">
      <div class="table-header-toolbar">
        <h3>🤖 Recent Completed Robotics Sessions</h3>
        <button id="view-all-sessions-btn" class="btn btn-secondary btn-sm">View All Sessions & Syllabus →</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Teacher</th>
              <th>School Visited</th>
              <th>Topic Taught</th>
              <th>Hours</th>
              <th>Location Status</th>
              <th>Kits Used</th>
            </tr>
          </thead>
          <tbody>
            ${sessions
              .slice(0, 5)
              .map(
                (s) => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 600;">${s.date}</td>
                <td><strong>${s.staffName}</strong></td>
                <td>${s.schoolName}</td>
                <td style="color: var(--cyan-primary); font-weight: 500;">${s.topicTaught}</td>
                <td><span class="status-badge badge-info">${s.hours} hrs</span></td>
                <td>
                  <span class="status-badge badge-verified">
                    ✅ GPS Verified
                  </span>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${s.kitsUsed || "Robotics Kits"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function bindDashboardEvents(container, state, onNavigateTab, onTriggerCheckIn, onTriggerCheckOut, onExportPayroll) {
  const checkinBtn = container.querySelector("#quick-checkin-nav-btn");
  if (checkinBtn) {
    checkinBtn.addEventListener("click", () => onNavigateTab("checkin"));
  }

  const exportBtn = container.querySelector("#export-payroll-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", onExportPayroll);
  }

  const dashCheckoutBtn = container.querySelector("#dash-checkout-btn");
  if (dashCheckoutBtn) {
    dashCheckoutBtn.addEventListener("click", onTriggerCheckOut);
  }

  const viewFinanceBtn = container.querySelector("#view-finance-tab-btn");
  if (viewFinanceBtn) {
    viewFinanceBtn.addEventListener("click", () => onNavigateTab("finance"));
  }

  const viewSessionsBtn = container.querySelector("#view-all-sessions-btn");
  if (viewSessionsBtn) {
    viewSessionsBtn.addEventListener("click", () => onNavigateTab("sessions"));
  }

  const scheduleBtns = container.querySelectorAll(".schedule-checkin-btn");
  scheduleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const schoolId = btn.getAttribute("data-school");
      onTriggerCheckIn(schoolId);
    });
  });

  // Start timer tick for active session if present
  const timerDisplay = container.querySelector("#dash-timer-display");
  if (timerDisplay) {
    const currentStaffId = state.currentUserRole === "admin" ? getStaff()[0].id : state.currentUserId;
    const active = getActiveSession(currentStaffId);
    if (active && active.checkInTimestamp) {
      const updateTimer = () => {
        const diffMs = Date.now() - active.checkInTimestamp;
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        timerDisplay.textContent = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      };
      updateTimer();
      const interval = setInterval(() => {
        if (!document.contains(timerDisplay)) {
          clearInterval(interval);
          return;
        }
        updateTimer();
      }, 1000);
    }
  }
}
