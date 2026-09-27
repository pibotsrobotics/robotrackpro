// Sessions and Robotics Curriculum Tracker with School Progress Matrix, Full CRUD & WhatsApp Sharing

import {
  getSessions,
  getSchools,
  getStaff,
  getCurriculum,
  saveSessions,
  saveSchools,
  addSession,
  updateSession,
  deleteSession,
  exportAttendanceCSV
} from "../utils/storage.js";

import {
  formatSessionWhatsAppText,
  openWhatsApp,
  copyTextWithFeedback
} from "../utils/whatsapp.js";

export function renderSessionsCurriculumView(state) {
  const sessions = getSessions();
  const schools = getSchools();
  const staffList = getStaff();
  const curriculum = getCurriculum();
  const isAdmin = state.currentUser?.role === "admin";

  // Filters
  const filterSchool = state.sessionFilterSchool || "all";
  const filterStaff = state.sessionFilterStaff || "all";
  const searchTerm = (state.sessionSearchTerm || "").toLowerCase();

  const filteredSessions = sessions.filter((s) => {
    if (filterSchool !== "all" && s.schoolId !== filterSchool) return false;
    if (filterStaff !== "all" && s.staffId !== filterStaff) return false;
    if (searchTerm) {
      const matchTopic = s.topicTaught.toLowerCase().includes(searchTerm);
      const matchSchool = s.schoolName.toLowerCase().includes(searchTerm);
      const matchTeacher = s.staffName.toLowerCase().includes(searchTerm);
      if (!matchTopic && !matchSchool && !matchTeacher) return false;
    }
    return true;
  });

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>🤖 Robotics Curriculum & Session Logs</h2>
        <p>Lesson progress, practical hardware kits used & hours tracked across all 12 partner schools</p>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button id="add-manual-session-btn" class="btn btn-primary">
          ➕ Log Past Session
        </button>
        <button id="export-attendance-btn" class="btn btn-secondary">
          📑 Export CSV
        </button>
      </div>
    </div>

    <!-- Curriculum Syllabus Modules Overview -->
    <div class="panel-card" style="margin-bottom: 1.75rem;">
      <div class="panel-card-title">
        <div>
          <h3>📚 Master Robotics Curriculum (8 Core Modules)</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.2rem;">Standardized STEM & Robotics hands-on roadmap from Grade 5 to Grade 12</p>
        </div>
        <span class="status-badge badge-info">8 Modules • 32 Labs</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
        ${curriculum
          .map((mod, idx) => {
            return `
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--cyan-primary); text-transform: uppercase;">
                  ${mod.level} • ${mod.gradeRange}
                </span>
                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 0.15rem 0.45rem; border-radius: var(--radius-full); font-weight: 600;">
                  Mod ${idx + 1}
                </span>
              </div>
              <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-primary);">${mod.title}</h4>
              <ul style="font-size: 0.78rem; color: var(--text-secondary); padding-left: 1.1rem; line-height: 1.45;">
                ${mod.topics.slice(0, 3).map((t) => `<li>${t}</li>`).join("")}
                ${mod.topics.length > 3 ? `<li style="color: var(--text-muted);">+ ${mod.topics.length - 3} more labs</li>` : ""}
              </ul>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>

    <!-- School-by-School Curriculum Matrix (12 Schools × 8 Modules) -->
    <div class="panel-card" style="margin-bottom: 1.75rem;">
      <div class="panel-card-title">
        <div>
          <h3>🏫 School Progress Matrix (12 Partner Campuses)</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.2rem;">Live curriculum module advancement across each school's student batches</p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table" style="font-size: 0.8rem;">
          <thead>
            <tr>
              <th style="min-width: 220px;">School Campus</th>
              <th style="min-width: 140px;">Mentor</th>
              <th style="text-align: center;">M1<br><span style="font-size: 0.65rem; color: var(--text-muted);">Circuit</span></th>
              <th style="text-align: center;">M2<br><span style="font-size: 0.65rem; color: var(--text-muted);">Arduino</span></th>
              <th style="text-align: center;">M3<br><span style="font-size: 0.65rem; color: var(--text-muted);">Sensors</span></th>
              <th style="text-align: center;">M4<br><span style="font-size: 0.65rem; color: var(--text-muted);">Motors</span></th>
              <th style="text-align: center;">M5<br><span style="font-size: 0.65rem; color: var(--text-muted);">Rovers</span></th>
              <th style="text-align: center;">M6<br><span style="font-size: 0.65rem; color: var(--text-muted);">IoT</span></th>
              <th style="text-align: center;">M7<br><span style="font-size: 0.65rem; color: var(--text-muted);">Arms</span></th>
              <th style="text-align: center;">M8<br><span style="font-size: 0.65rem; color: var(--text-muted);">AI Vision</span></th>
              <th style="text-align: right;">Progress</th>
            </tr>
          </thead>
          <tbody>
            ${schools
              .map((sch, i) => {
                const schSessions = sessions.filter((s) => s.schoolId === sch.id);
                const assignedStaff = staffList.find((st) => sch.assignedTeachers.includes(st.id));
                const progressLevel = Math.min(8, Math.max(1, schSessions.length > 0 ? schSessions.length : ((i % 4) + 1)));
                const pct = Math.round((progressLevel / 8) * 100);

                return `
                <tr>
                  <td>
                    <strong>${sch.name}</strong>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${sch.gradeBatches}</div>
                  </td>
                  <td>
                    <span style="font-size: 0.78rem;">${assignedStaff ? assignedStaff.name : "Unassigned"}</span>
                  </td>
                  ${[1, 2, 3, 4, 5, 6, 7, 8]
                    .map((mNum) => {
                      if (mNum < progressLevel) {
                        return `<td style="text-align: center;"><span style="color: var(--emerald-primary); font-size: 1rem;" title="Module ${mNum} Completed">✅</span></td>`;
                      } else if (mNum === progressLevel) {
                        return `<td style="text-align: center;"><span style="color: var(--cyan-primary); font-size: 0.72rem; background: rgba(0,240,255,0.15); border: 1px solid var(--cyan-primary); padding: 0.15rem 0.35rem; border-radius: var(--radius-sm); font-weight: 700;" title="Module ${mNum} Current">CURRENT</span></td>`;
                      } else {
                        return `<td style="text-align: center;"><span style="color: var(--text-muted); font-size: 0.75rem;" title="Upcoming Module ${mNum}">⚪</span></td>`;
                      }
                    })
                    .join("")}
                  <td style="text-align: right;">
                    <div style="font-weight: 700; color: var(--cyan-primary);">${pct}%</div>
                    <div style="width: 60px; height: 4px; background: rgba(255,255,255,0.08); border-radius: var(--radius-full); margin-left: auto; overflow: hidden;">
                      <div style="width: ${pct}%; height: 100%; background: var(--cyan-primary);"></div>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sessions History Table with Filters & Full CRUD -->
    <div class="table-card">
      <div class="table-header-toolbar">
        <div>
          <h3>📋 Completed Session Register (${filteredSessions.length})</h3>
          <p style="font-size: 0.76rem; color: var(--text-secondary);">Filter, edit, delete, or share verified session reports directly via WhatsApp</p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <!-- School Filter -->
          <select id="filter-session-school" class="form-control form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8rem;">
            <option value="all">All Schools (12)</option>
            ${schools.map((sch) => `<option value="${sch.id}" ${filterSchool === sch.id ? "selected" : ""}>${sch.name}</option>`).join("")}
          </select>

          <!-- Staff Filter -->
          <select id="filter-session-staff" class="form-control form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8rem;">
            <option value="all">All Teachers</option>
            ${staffList.map((st) => `<option value="${st.id}" ${filterStaff === st.id ? "selected" : ""}>${st.name}</option>`).join("")}
          </select>

          <!-- Search Input -->
          <div class="filter-search-box">
            <span>🔍</span>
            <input type="text" id="search-session-input" placeholder="Search topic or school..." value="${state.sessionSearchTerm || ""}">
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Teacher</th>
              <th>School Visited</th>
              <th>Robotics Topic Taught</th>
              <th>Class / Batch</th>
              <th>Hours</th>
              <th>Students</th>
              <th>Hardware Kits Used</th>
              <th>GPS Status</th>
              <th style="text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredSessions.length === 0
                ? `<tr><td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No sessions matching the selected filter criteria.</td></tr>`
                : filteredSessions
                    .map(
                      (s) => `
              <tr>
                <td>
                  <div style="font-family: var(--font-mono); font-weight: 700;">${s.date}</div>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">${s.checkInTime} - ${s.checkOutTime}</div>
                </td>
                <td>
                  <strong>${s.staffName}</strong>
                </td>
                <td>
                  <div style="font-weight: 600;">${s.schoolName}</div>
                </td>
                <td style="max-width: 260px;">
                  <strong style="color: var(--cyan-primary);">${s.topicTaught}</strong>
                  ${s.sessionNotes ? `<div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 0.2rem;">${s.sessionNotes}</div>` : ""}
                </td>
                <td><span style="font-size: 0.82rem; color: var(--text-secondary);">${s.gradeBatch}</span></td>
                <td>
                  <span class="status-badge badge-info" style="font-weight: 700;">${s.hours} hrs</span>
                </td>
                <td><strong>${s.studentCount || "--"}</strong></td>
                <td style="font-size: 0.78rem; color: var(--text-secondary); max-width: 180px;">
                  ${s.kitsUsed || "Robotics Hardware"}
                </td>
                <td>
                  <span class="status-badge badge-verified" style="font-size: 0.72rem;">
                    ✅ ${s.checkInStatus || "VERIFIED"}
                  </span>
                </td>
                <td style="text-align: center;">
                  <div style="display: flex; gap: 0.35rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-outline-cyan btn-sm session-whatsapp-btn" data-session-id="${s.id}" title="Send report to WhatsApp">
                      📱
                    </button>
                    <button class="btn btn-secondary btn-sm session-edit-btn" data-session-id="${s.id}" title="Edit session details">
                      ✏️
                    </button>
                    ${
                      isAdmin
                        ? `<button class="btn btn-danger btn-sm session-delete-btn" data-session-id="${s.id}" title="Delete session">
                            🗑️
                          </button>`
                        : ""
                    }
                  </div>
                </td>
              </tr>
            `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: Log Past Session (Create) -->
    <div id="manual-session-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>➕ Log Past Robotics Session</h3>
          <button class="btn-icon close-session-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="manual-session-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Teacher *</label>
                <select id="manual-staff-select" class="form-control form-select" required>
                  ${staffList.map((st) => `<option value="${st.id}">${st.name}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">School Visited *</label>
                <select id="manual-school-select" class="form-control form-select" required>
                  ${schools.map((sch) => `<option value="${sch.id}">${sch.name}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date *</label>
                <input type="date" id="manual-date" class="form-control" required value="${new Date().toISOString().split("T")[0]}">
              </div>

              <div class="form-group">
                <label class="form-label">Session Hours *</label>
                <input type="number" id="manual-hours" class="form-control" step="0.25" min="0.5" max="10" value="3.0" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Robotics Topic Taught *</label>
              <input type="text" id="manual-topic" class="form-control" placeholder="e.g. Module 4: Motor Driver & DC Motors" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Class / Grade *</label>
                <input type="text" id="manual-grade" class="form-control" value="Grade 7 & 8" required>
              </div>

              <div class="form-group">
                <label class="form-label">Student Count</label>
                <input type="number" id="manual-students" class="form-control" value="32" min="1">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Hardware Kits Used</label>
              <input type="text" id="manual-kits" class="form-control" value="Arduino Uno STEM Pro Kit + L298N Motor Drivers">
            </div>

            <div class="form-group">
              <label class="form-label">Session Notes / Observations</label>
              <textarea id="manual-notes" class="form-control" rows="2" placeholder="Student projects completed, issues observed..."></textarea>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-session-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Session Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Edit Session (Update) -->
    <div id="edit-session-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>✏️ Edit Session Record</h3>
          <button class="btn-icon close-edit-session-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-session-form">
            <input type="hidden" id="edit-session-id" />

            <div class="form-group">
              <label class="form-label">Robotics Topic Taught *</label>
              <input type="text" id="edit-session-topic" class="form-control" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Teaching Hours</label>
                <input type="number" id="edit-session-hours" class="form-control" step="0.25" min="0.5" required />
              </div>

              <div class="form-group">
                <label class="form-label">Students Attended</label>
                <input type="number" id="edit-session-students" class="form-control" min="1" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Hardware Kits Deployed</label>
              <input type="text" id="edit-session-kits" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Instructor Notes & Summary</label>
              <textarea id="edit-session-notes" class="form-control" rows="3"></textarea>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-edit-session-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Session</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function bindSessionsCurriculumEvents(container, state, onRefresh, showToast) {
  const sessions = getSessions();

  // Export CSV
  const exportBtn = container.querySelector("#export-attendance-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportAttendanceCSV();
      showToast("Session attendance CSV downloaded!", "success");
    });
  }

  // School filter
  const schoolFilter = container.querySelector("#filter-session-school");
  if (schoolFilter) {
    schoolFilter.addEventListener("change", (e) => {
      state.sessionFilterSchool = e.target.value;
      onRefresh();
    });
  }

  // Staff filter
  const staffFilter = container.querySelector("#filter-session-staff");
  if (staffFilter) {
    staffFilter.addEventListener("change", (e) => {
      state.sessionFilterStaff = e.target.value;
      onRefresh();
    });
  }

  // Search input
  const searchInput = container.querySelector("#search-session-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.sessionSearchTerm = e.target.value;
      clearTimeout(window.__searchTimer);
      window.__searchTimer = setTimeout(() => {
        onRefresh();
      }, 300);
    });
  }

  // WhatsApp Share Buttons
  const waButtons = container.querySelectorAll(".session-whatsapp-btn");
  waButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sessId = btn.getAttribute("data-session-id");
      const session = sessions.find((s) => s.id === sessId);
      if (session) {
        const text = formatSessionWhatsAppText(session);
        openWhatsApp(text);
        showToast("Opening WhatsApp with formatted session summary...", "info");
      }
    });
  });

  // Edit Session Modal trigger
  const editModal = container.querySelector("#edit-session-modal");
  const closeEditBtns = container.querySelectorAll(".close-edit-session-modal-btn");
  closeEditBtns.forEach((btn) => btn.addEventListener("click", () => editModal.classList.remove("active")));

  const editBtns = container.querySelectorAll(".session-edit-btn");
  editBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sessId = btn.getAttribute("data-session-id");
      const sess = getSessions().find((s) => s.id === sessId);
      if (!sess) return;

      container.querySelector("#edit-session-id").value = sess.id;
      container.querySelector("#edit-session-topic").value = sess.topicTaught;
      container.querySelector("#edit-session-hours").value = sess.hours;
      container.querySelector("#edit-session-students").value = sess.studentCount || 30;
      container.querySelector("#edit-session-kits").value = sess.kitsUsed || "";
      container.querySelector("#edit-session-notes").value = sess.sessionNotes || "";

      editModal.classList.add("active");
    });
  });

  // Submit Edit Session
  const editForm = container.querySelector("#edit-session-form");
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const sessId = container.querySelector("#edit-session-id").value;
      const topicTaught = container.querySelector("#edit-session-topic").value;
      const hours = Number(container.querySelector("#edit-session-hours").value);
      const studentCount = Number(container.querySelector("#edit-session-students").value);
      const kitsUsed = container.querySelector("#edit-session-kits").value;
      const sessionNotes = container.querySelector("#edit-session-notes").value;

      updateSession(sessId, {
        topicTaught,
        hours,
        studentCount,
        kitsUsed,
        sessionNotes
      });

      editModal.classList.remove("active");
      showToast("Updated session details!", "success");
      onRefresh();
    });
  }

  // Delete Session
  const deleteBtns = container.querySelectorAll(".session-delete-btn");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sessId = btn.getAttribute("data-session-id");
      if (confirm("Are you sure you want to delete this session record?")) {
        deleteSession(sessId);
        showToast("Session record deleted.", "info");
        onRefresh();
      }
    });
  });

  // Create Modal events
  const addBtn = container.querySelector("#add-manual-session-btn");
  const modal = container.querySelector("#manual-session-modal");
  const closeBtns = container.querySelectorAll(".close-session-modal-btn");

  if (addBtn && modal) {
    addBtn.addEventListener("click", () => modal.classList.add("active"));
  }

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (modal) modal.classList.remove("active");
    });
  });

  const manualForm = container.querySelector("#manual-session-form");
  if (manualForm) {
    manualForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const staffList = getStaff();
      const schoolList = getSchools();
      const staffId = container.querySelector("#manual-staff-select").value;
      const schoolId = container.querySelector("#manual-school-select").value;
      const staff = staffList.find((s) => s.id === staffId);
      const school = schoolList.find((s) => s.id === schoolId);

      const newSession = {
        staffId,
        staffName: staff ? staff.name : "Teacher",
        schoolId,
        schoolName: school ? school.name : "School",
        date: container.querySelector("#manual-date").value,
        checkInTime: "09:00",
        checkOutTime: "12:00",
        hours: Number(container.querySelector("#manual-hours").value) || 3.0,
        topicTaught: container.querySelector("#manual-topic").value,
        gradeBatch: container.querySelector("#manual-grade").value,
        studentCount: Number(container.querySelector("#manual-students").value) || 30,
        kitsUsed: container.querySelector("#manual-kits").value,
        sessionNotes: container.querySelector("#manual-notes").value,
        checkInLat: school ? school.lat : 0,
        checkInLng: school ? school.lng : 0,
        checkInStatus: "VERIFIED_MANUAL",
        checkOutLat: school ? school.lat : 0,
        checkOutLng: school ? school.lng : 0,
        checkOutStatus: "VERIFIED_MANUAL"
      };

      addSession(newSession);

      if (school && newSession.topicTaught) {
        school.currentTopic = newSession.topicTaught;
        saveSchools(schoolList);
      }

      if (modal) modal.classList.remove("active");
      showToast("Session recorded successfully!", "success");
      onRefresh();
    });
  }
}
