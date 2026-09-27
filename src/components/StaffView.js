// Staff and Robotics Teachers Management with Full CRUD (Create, Read, Update, Delete)

import {
  getStaff,
  getSchools,
  getSessions,
  saveStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  calculateStaffFinancials,
  formatCurrency
} from "../utils/storage.js";

export function renderStaffView(state) {
  const staffList = getStaff();
  const schools = getSchools();
  const sessions = getSessions();
  const isAdmin = state.currentUser?.role === "admin";

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>👥 Robotics Faculty & Instructors (${staffList.length} Teachers)</h2>
        <p>Instructor profiles, hourly rates, school assignments & lifetime teaching metrics</p>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${
          isAdmin
            ? `<button id="add-staff-modal-btn" class="btn btn-primary">
                ➕ Register New Instructor
              </button>`
            : ""
        }
      </div>
    </div>

    <!-- Staff Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      ${staffList
        .map((staff) => {
          const fin = calculateStaffFinancials(staff.id);
          const assignedSchoolsList = schools.filter((sch) => staff.assignedSchools.includes(sch.id));

          return `
          <div class="panel-card" style="border-top: 3px solid var(--emerald-primary); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.9rem;">
                  <div style="font-size: 2.8rem; background: rgba(255,255,255,0.05); width: 64px; height: 64px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-subtle);">
                    ${staff.avatar || "👨‍🏫"}
                  </div>
                  <div>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.2rem;">${staff.name}</h3>
                    <div style="font-size: 0.82rem; color: var(--text-secondary);">${staff.role}</div>
                    <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.15rem;">Joined: ${staff.joinedDate}</div>
                  </div>
                </div>
                <span class="status-badge badge-verified">
                  ● ${staff.status || "Active"}
                </span>
              </div>

              <!-- Contact and Specialization -->
              <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.8rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.4rem;">
                <div>📧 <strong>${staff.email}</strong></div>
                <div>📞 <strong>${staff.phone}</strong></div>
                <div style="color: var(--cyan-primary);">🛠️ <em>${staff.specialty}</em></div>
              </div>

              ${
                isAdmin
                  ? `
              <!-- Wage & Rate Structure (Admin Only) -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
                  <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">
                    ${staff.wageType === "monthly" ? "📅 Monthly Salary" : staff.wageType === "daily" ? "📆 Daily Pay Rate" : "⏱️ Hourly Pay Rate"}
                  </div>
                  <strong style="font-size: 1.15rem; color: var(--cyan-primary);">
                    ${staff.wageType === "monthly" ? `${formatCurrency(staff.monthlySalary || 35000)} / mo` : staff.wageType === "daily" ? `${formatCurrency(staff.dailyRate || 2200)} / day` : `${formatCurrency(staff.hourlyRate || 750)} / hr`}
                  </strong>
                  <div style="font-size: 0.68rem; color: var(--text-secondary); margin-top: 0.15rem;">
                    ${staff.wageType === "monthly" ? "Per-Month Fixed Model" : staff.wageType === "daily" ? "Per-Day Wage Model" : "Per-Hour Wage Model"}
                  </div>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
                  <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Travel Policy</div>
                  <strong style="font-size: 1.05rem; color: var(--emerald-primary);">Request-Based</strong>
                  <div style="font-size: 0.68rem; color: var(--text-secondary); margin-top: 0.15rem;">No Flat Rate Allowed</div>
                </div>
              </div>

              <!-- Teaching Performance Metrics (Admin View: with Gross Earnings) -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: var(--radius-md); text-align: center; margin-bottom: 1rem; font-size: 0.82rem;">
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">SESSIONS</div>
                  <strong style="font-size: 1rem;">${fin.totalSessions}</strong>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">${staff.wageType === "daily" ? "ACTIVE DAYS" : "TOTAL HOURS"}</div>
                  <strong style="font-size: 1rem; color: var(--cyan-primary);">${staff.wageType === "daily" ? `${fin.workingDays} days` : `${fin.totalHours} hrs`}</strong>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">EARNED GROSS</div>
                  <strong style="font-size: 1rem; color: var(--emerald-primary);">${formatCurrency(fin.earnedSalary)}</strong>
                </div>
              </div>
              `
                  : `
              <!-- Academic Engagement Summary (Staff & School View: No Salary or Rates Shown) -->
              <div style="background: rgba(255,255,255,0.03); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1rem; font-size: 0.82rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Faculty Appointment</div>
                  <strong style="color: var(--cyan-primary);">${staff.wageType === "monthly" ? "Full-Time STEM Lead" : "Visiting Robotics Specialist"}</strong>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Assigned Campuses</div>
                  <strong style="color: var(--text-primary);">${staff.assignedSchools.length} Schools</strong>
                </div>
              </div>

              <!-- Teaching Performance Metrics (Operational View: No Salary Shown) -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: var(--radius-md); text-align: center; margin-bottom: 1rem; font-size: 0.82rem;">
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">SESSIONS</div>
                  <strong style="font-size: 1rem; color: var(--cyan-primary);">${fin.totalSessions}</strong>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">HOURS TAUGHT</div>
                  <strong style="font-size: 1rem; color: var(--emerald-primary);">${fin.totalHours} hrs</strong>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">CAMPUS LOAD</div>
                  <strong style="font-size: 1rem; color: #00F0FF;">${staff.assignedSchools.length} Schools</strong>
                </div>
              </div>
              `
              }

              <!-- Assigned Schools List -->
              <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
                  Assigned Schools (${assignedSchoolsList.length})
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                  ${
                    assignedSchoolsList.length === 0
                      ? `<span style="font-size: 0.75rem; color: var(--text-muted);">None assigned yet</span>`
                      : assignedSchoolsList
                          .map(
                            (sch) => `
                        <span style="font-size: 0.74rem; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #C7D2FE; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);">
                          🏫 ${sch.name.split(" ")[0]} ${sch.name.split(" ")[1] || ""}
                        </span>
                      `
                          )
                          .join("")
                  }
                </div>
              </div>
            </div>

            <!-- Actions: Edit & Delete (Admin access) -->
            ${
              isAdmin
                ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
                    <button class="btn btn-outline-cyan btn-sm edit-staff-btn" data-id="${staff.id}">
                      ✏️ Edit Profile
                    </button>
                    <button class="btn btn-danger btn-sm delete-staff-btn" data-id="${staff.id}" data-name="${staff.name}">
                      🗑️ Remove
                    </button>
                  </div>`
                : ""
            }
          </div>
        `;
        })
        .join("")}
    </div>

    <!-- MODAL 1: Register New Staff (Create) -->
    <div id="add-staff-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>👥 Register New Robotics Teacher</h3>
          <button class="btn-icon close-staff-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="new-staff-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" id="new-staff-name" class="form-control" placeholder="e.g. David Chen" required>
              </div>

              <div class="form-group">
                <label class="form-label">Role / Designation *</label>
                <input type="text" id="new-staff-role" class="form-control" value="Robotics Trainer & STEM Mentor" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" id="new-staff-email" class="form-control" placeholder="david.chen@robolabs.edu" required>
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="tel" id="new-staff-phone" class="form-control" placeholder="+91 98403 45678" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Wage Calculation Model *</label>
                <select id="new-staff-wage-type" class="form-control form-select" required>
                  <option value="hourly">⏱️ Per Hour (Hourly Rate)</option>
                  <option value="monthly">📅 Per Month (Monthly Fixed Salary)</option>
                  <option value="daily">📆 Per Day (Flat Daily Rate)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" id="new-staff-rate-label">Hourly Rate (₹ / $) *</label>
                <input type="number" id="new-staff-rate" class="form-control" value="750" min="100" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Travel Policy</label>
                <input type="text" class="form-control" value="🚗 On-Demand Requests & Actuals Only (No Flat Rate)" readonly style="background: rgba(255,255,255,0.05); color: var(--cyan-primary); font-size: 0.8rem;">
              </div>

              <div class="form-group">
                <label class="form-label">Technical Specialties & Kits</label>
                <input type="text" id="new-staff-specialty" class="form-control" placeholder="e.g. Raspberry Pi, Computer Vision, ROS, Arduino Uno">
              </div>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-staff-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Instructor</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Edit Staff (Update) -->
    <div id="edit-staff-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>✏️ Edit Instructor Profile & Rates</h3>
          <button class="btn-icon close-edit-staff-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-staff-form">
            <input type="hidden" id="edit-staff-id" />

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" id="edit-staff-name" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label">Designation *</label>
                <input type="text" id="edit-staff-role" class="form-control" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input type="email" id="edit-staff-email" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label">Phone *</label>
                <input type="tel" id="edit-staff-phone" class="form-control" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Wage Calculation Model *</label>
                <select id="edit-staff-wage-type" class="form-control form-select" required>
                  <option value="hourly">⏱️ Per Hour (Hourly Rate)</option>
                  <option value="monthly">📅 Per Month (Monthly Fixed Salary)</option>
                  <option value="daily">📆 Per Day (Flat Daily Rate)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" id="edit-staff-rate-label">Rate (₹ / $) *</label>
                <input type="number" id="edit-staff-rate" class="form-control" required min="100" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Travel Policy</label>
                <input type="text" class="form-control" value="🚗 Request-Based Reimbursement Only (No Flat Rate)" readonly style="background: rgba(255,255,255,0.05); color: var(--cyan-primary); font-size: 0.8rem;">
              </div>

              <div class="form-group">
                <label class="form-label">Specialties & Lab Expertise</label>
                <input type="text" id="edit-staff-specialty" class="form-control" />
              </div>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-edit-staff-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function bindStaffEvents(container, state, onRefresh, showToast) {
  const staffList = getStaff();

  // Create Modal triggers
  const addModal = container.querySelector("#add-staff-modal");
  const openBtn = container.querySelector("#add-staff-modal-btn");
  const closeBtns = container.querySelectorAll(".close-staff-modal-btn");

  if (openBtn && addModal) openBtn.addEventListener("click", () => addModal.classList.add("active"));
  closeBtns.forEach((btn) => btn.addEventListener("click", () => addModal.classList.remove("active")));

  // Dynamic rate label updates for Create modal
  const newWageTypeSelect = container.querySelector("#new-staff-wage-type");
  const newRateLabel = container.querySelector("#new-staff-rate-label");
  const newRateInput = container.querySelector("#new-staff-rate");
  if (newWageTypeSelect && newRateLabel && newRateInput) {
    newWageTypeSelect.addEventListener("change", (e) => {
      if (e.target.value === "monthly") {
        newRateLabel.textContent = "Monthly Salary (₹ / $) *";
        newRateInput.value = "35000";
      } else if (e.target.value === "daily") {
        newRateLabel.textContent = "Daily Rate (₹ / $) *";
        newRateInput.value = "2200";
      } else {
        newRateLabel.textContent = "Hourly Rate (₹ / $) *";
        newRateInput.value = "750";
      }
    });
  }

  // Submit New Staff
  const form = container.querySelector("#new-staff-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = container.querySelector("#new-staff-name").value;
      const role = container.querySelector("#new-staff-role").value;
      const email = container.querySelector("#new-staff-email").value;
      const phone = container.querySelector("#new-staff-phone").value;
      const wageType = container.querySelector("#new-staff-wage-type").value;
      const rateVal = Number(container.querySelector("#new-staff-rate").value) || (wageType === "monthly" ? 35000 : (wageType === "daily" ? 2200 : 750));
      const hourlyRate = wageType === "hourly" ? rateVal : 0;
      const monthlySalary = wageType === "monthly" ? rateVal : 0;
      const dailyRate = wageType === "daily" ? rateVal : 0;
      const specialty = container.querySelector("#new-staff-specialty").value || "General Robotics & Embedded Systems";

      addStaff({
        name,
        role,
        email,
        phone,
        wageType,
        hourlyRate,
        monthlySalary,
        dailyRate,
        travelPolicy: "Request-Based Only",
        specialty,
        assignedSchools: ["school-1", "school-2"]
      });

      addModal.classList.remove("active");
      const modelLabel = wageType === "monthly" ? "Per-Month" : (wageType === "daily" ? "Per-Day" : "Per-Hour");
      showToast(`Teacher "${name}" registered with ${modelLabel} wage model!`, "success");
      onRefresh();
    });
  }

  // Dynamic rate label updates for Edit modal
  const editWageTypeSelect = container.querySelector("#edit-staff-wage-type");
  const editRateLabel = container.querySelector("#edit-staff-rate-label");
  const editRateInput = container.querySelector("#edit-staff-rate");
  if (editWageTypeSelect && editRateLabel && editRateInput) {
    editWageTypeSelect.addEventListener("change", (e) => {
      if (e.target.value === "monthly") {
        editRateLabel.textContent = "Monthly Salary (₹ / $) *";
      } else if (e.target.value === "daily") {
        editRateLabel.textContent = "Daily Rate (₹ / $) *";
      } else {
        editRateLabel.textContent = "Hourly Rate (₹ / $) *";
      }
    });
  }

  // Edit Modal triggers
  const editModal = container.querySelector("#edit-staff-modal");
  const closeEditBtns = container.querySelectorAll(".close-edit-staff-modal-btn");
  closeEditBtns.forEach((btn) => btn.addEventListener("click", () => editModal.classList.remove("active")));

  const editBtns = container.querySelectorAll(".edit-staff-btn");
  editBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const staffId = btn.getAttribute("data-id");
      const staff = getStaff().find((s) => s.id === staffId);
      if (!staff) return;

      const wageType = staff.wageType || (staff.id === "staff-2" ? "monthly" : "hourly");
      container.querySelector("#edit-staff-id").value = staff.id;
      container.querySelector("#edit-staff-name").value = staff.name;
      container.querySelector("#edit-staff-role").value = staff.role;
      container.querySelector("#edit-staff-email").value = staff.email;
      container.querySelector("#edit-staff-phone").value = staff.phone;
      container.querySelector("#edit-staff-wage-type").value = wageType;
      
      const currentRate = wageType === "monthly" ? (staff.monthlySalary || 35000) : (wageType === "daily" ? (staff.dailyRate || 2200) : (staff.hourlyRate || 750));
      container.querySelector("#edit-staff-rate").value = currentRate;
      container.querySelector("#edit-staff-rate-label").textContent = wageType === "monthly" ? "Monthly Salary (₹ / $) *" : (wageType === "daily" ? "Daily Rate (₹ / $) *" : "Hourly Rate (₹ / $) *");
      
      container.querySelector("#edit-staff-specialty").value = staff.specialty || "";

      editModal.classList.add("active");
    });
  });

  // Submit Edit Staff
  const editForm = container.querySelector("#edit-staff-form");
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const staffId = container.querySelector("#edit-staff-id").value;
      const name = container.querySelector("#edit-staff-name").value;
      const role = container.querySelector("#edit-staff-role").value;
      const email = container.querySelector("#edit-staff-email").value;
      const phone = container.querySelector("#edit-staff-phone").value;
      const wageType = container.querySelector("#edit-staff-wage-type").value;
      const rateVal = Number(container.querySelector("#edit-staff-rate").value) || (wageType === "monthly" ? 35000 : (wageType === "daily" ? 2200 : 750));
      const hourlyRate = wageType === "hourly" ? rateVal : 0;
      const monthlySalary = wageType === "monthly" ? rateVal : 0;
      const dailyRate = wageType === "daily" ? rateVal : 0;
      const specialty = container.querySelector("#edit-staff-specialty").value;

      updateStaff(staffId, {
        name,
        role,
        email,
        phone,
        wageType,
        hourlyRate,
        monthlySalary,
        dailyRate,
        travelPolicy: "Request-Based Only",
        specialty
      });

      editModal.classList.remove("active");
      showToast(`Updated profile & wage structure for ${name}!`, "success");
      onRefresh();
    });
  }

  // Delete Staff
  const deleteBtns = container.querySelectorAll(".delete-staff-btn");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const staffId = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      if (confirm(`Are you sure you want to remove teacher "${name}" from the academy system?`)) {
        deleteStaff(staffId);
        showToast(`Teacher "${name}" removed.`, "info");
        onRefresh();
      }
    });
  });
}
