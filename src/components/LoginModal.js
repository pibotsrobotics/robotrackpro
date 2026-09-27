// Multi-Role Login Modal & Authentication View for RoboTrack Pro

import { getStaff, getSchools } from "../utils/storage.js";
import { loginUser, getAuthUser } from "../utils/auth.js";

export function renderLoginModal(state) {
  const staffList = getStaff();
  const schools = getSchools();
  const currentAuth = getAuthUser();

  return `
    <div id="auth-modal" class="modal-overlay ${state.showLoginModal ? "active" : ""}">
      <div class="modal-dialog" style="max-width: 520px; border-top: 4px solid var(--cyan-primary);">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.5rem;">🔐</span>
            <div>
              <h3 style="font-size: 1.2rem; margin: 0;">RoboTrack Pro Access Portal</h3>
              <p style="font-size: 0.76rem; color: var(--text-secondary); margin: 0;">Multi-Role Authentication: Admin • Staff • School Portal</p>
            </div>
          </div>
          <button class="btn-icon close-auth-modal-btn">✕</button>
        </div>

        <div class="modal-body" style="padding-top: 0.5rem;">
          <!-- Role Navigation Tabs inside Modal -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4rem; background: rgba(0,0,0,0.3); padding: 0.3rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
            <button class="auth-role-tab active" data-role="admin" style="padding: 0.5rem 0.2rem; font-size: 0.78rem; border-radius: var(--radius-sm); border: none; font-weight: 700; cursor: pointer; background: var(--cyan-primary); color: #080B11;">
              👑 Admin
            </button>
            <button class="auth-role-tab" data-role="staff" style="padding: 0.5rem 0.2rem; font-size: 0.78rem; border-radius: var(--radius-sm); border: none; font-weight: 700; cursor: pointer; background: transparent; color: var(--text-secondary);">
              👨‍🏫 Staff
            </button>
            <button class="auth-role-tab" data-role="school" style="padding: 0.5rem 0.2rem; font-size: 0.78rem; border-radius: var(--radius-sm); border: none; font-weight: 700; cursor: pointer; background: transparent; color: var(--text-secondary);">
              🏫 School
            </button>
          </div>

          <!-- ADMIN FORM -->
          <form id="auth-admin-form" class="auth-role-form active">
            <div style="background: rgba(0,240,255,0.06); border: 1px solid var(--border-highlight); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.78rem; color: var(--cyan-primary);">
              👑 <strong>Academy Director & Administrator Access</strong>: Full control over teachers, partner schools, salary disbursements, and location audits.
            </div>

            <div class="form-group">
              <label class="form-label">Director Email</label>
              <input type="email" id="auth-admin-email" class="form-control" value="admin@robolabs.edu" required />
            </div>

            <div class="form-group">
              <label class="form-label">Admin Security PIN / Password</label>
              <input type="password" id="auth-admin-pass" class="form-control" value="admin123" required />
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Demo password: <code>admin123</code></div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
              Sign In as Academy Director
            </button>

            <!-- Quick Demo Fill -->
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1); text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">⚡ 1-Click Fast Login:</span>
              <button type="button" class="btn btn-secondary btn-sm quick-login-btn" data-role="admin">
                👑 Instant Director Login
              </button>
            </div>
          </form>

          <!-- STAFF / TEACHER FORM -->
          <form id="auth-staff-form" class="auth-role-form" style="display: none;">
            <div style="background: rgba(16,185,129,0.08); border: 1px solid var(--emerald-primary); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.78rem; color: #6EE7B7;">
              👨‍🏫 <strong>Instructor & Mentor Access</strong>: Perform geofenced check-in at school gates, submit lesson topic logs, and view your teaching earnings.
            </div>

            <div class="form-group">
              <label class="form-label">Select Robotics Teacher *</label>
              <select id="auth-staff-select" class="form-control form-select">
                ${staffList
                  .map(
                    (s) => `
                  <option value="${s.id}" data-email="${s.email}">
                    ${s.avatar || "👨‍🏫"} ${s.name} (${s.role.split(" ")[0]} • ${s.assignedSchools.length} Schools)
                  </option>
                `
                  )
                  .join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Staff Password</label>
              <input type="password" id="auth-staff-pass" class="form-control" value="staff123" required />
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Demo password: <code>staff123</code></div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
              Sign In as Instructor
            </button>

            <!-- Quick Demo Fills for Teachers -->
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1); text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">⚡ 1-Click Fast Teacher Login:</span>
              <div style="display: flex; gap: 0.5rem; justify-content: center;">
                <button type="button" class="btn btn-secondary btn-sm quick-login-btn" data-role="staff" data-id="staff-1">
                  👨‍🏫 Alex Morgan
                </button>
                <button type="button" class="btn btn-secondary btn-sm quick-login-btn" data-role="staff" data-id="staff-2">
                  👩‍🏫 Priya Sharma
                </button>
              </div>
            </div>
          </form>

          <!-- SCHOOL PRINCIPAL / COORDINATOR FORM -->
          <form id="auth-school-form" class="auth-role-form" style="display: none;">
            <div style="background: rgba(99,102,241,0.08); border: 1px solid var(--indigo-primary); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.78rem; color: #A5B4FC;">
              🏫 <strong>Partner School Portal</strong>: Review robotics curriculum completion, view mentor visit history, verify student batch progress, and see lab kits stationed.
            </div>

            <div class="form-group">
              <label class="form-label">Select Partner School Campus *</label>
              <select id="auth-school-select" class="form-control form-select">
                ${schools
                  .map(
                    (sch) => `
                  <option value="${sch.id}">
                    🏫 ${sch.name} (${sch.contactPerson})
                  </option>
                `
                  )
                  .join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">School Portal Access Key</label>
              <input type="password" id="auth-school-pass" class="form-control" value="school123" required />
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Demo password: <code>school123</code></div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
              Enter School Portal
            </button>

            <!-- Quick Demo Fills for Schools -->
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1); text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">⚡ 1-Click Fast Campus Login:</span>
              <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary btn-sm quick-login-btn" data-role="school" data-id="school-1">
                  🏫 St. Xavier's Int'l
                </button>
                <button type="button" class="btn btn-secondary btn-sm quick-login-btn" data-role="school" data-id="school-6">
                  🏫 Greenwood High
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function bindLoginModalEvents(container, state, onLoginSuccess, showToast) {
  const modal = container.querySelector("#auth-modal");
  const closeBtn = container.querySelector(".close-auth-modal-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      state.showLoginModal = false;
      modal?.classList.remove("active");
    });
  }

  // Switch Role Tabs in Modal
  const roleTabs = container.querySelectorAll(".auth-role-tab");
  const adminForm = container.querySelector("#auth-admin-form");
  const staffForm = container.querySelector("#auth-staff-form");
  const schoolForm = container.querySelector("#auth-school-form");

  roleTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      roleTabs.forEach((t) => {
        t.classList.remove("active");
        t.style.background = "transparent";
        t.style.color = "var(--text-secondary)";
      });
      tab.classList.add("active");
      tab.style.background = "var(--cyan-primary)";
      tab.style.color = "#080B11";

      const role = tab.getAttribute("data-role");
      if (adminForm) adminForm.style.display = role === "admin" ? "block" : "none";
      if (staffForm) staffForm.style.display = role === "staff" ? "block" : "none";
      if (schoolForm) schoolForm.style.display = role === "school" ? "block" : "none";
    });
  });

  // Admin Submit
  if (adminForm) {
    adminForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = container.querySelector("#auth-admin-email").value;
      const pass = container.querySelector("#auth-admin-pass").value;

      try {
        const user = loginUser({ role: "admin", email, password: pass });
        state.showLoginModal = false;
        modal?.classList.remove("active");
        showToast(`Welcome back, ${user.name}! (Director Access)`, "success");
        onLoginSuccess(user);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  // Staff Submit
  if (staffForm) {
    staffForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const staffSelect = container.querySelector("#auth-staff-select");
      const entityId = staffSelect.value;
      const pass = container.querySelector("#auth-staff-pass").value;

      try {
        const user = loginUser({ role: "staff", entityId, password: pass });
        state.showLoginModal = false;
        modal?.classList.remove("active");
        showToast(`Welcome, ${user.name}! (Instructor Access)`, "success");
        onLoginSuccess(user);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  // School Submit
  if (schoolForm) {
    schoolForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const schoolSelect = container.querySelector("#auth-school-select");
      const entityId = schoolSelect.value;
      const pass = container.querySelector("#auth-school-pass").value;

      try {
        const user = loginUser({ role: "school", entityId, password: pass });
        state.showLoginModal = false;
        modal?.classList.remove("active");
        showToast(`Welcome, ${user.name}! (School Portal Access)`, "success");
        onLoginSuccess(user);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  // Quick 1-Click Demo Logins
  const quickBtns = container.querySelectorAll(".quick-login-btn");
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.getAttribute("data-role");
      const id = btn.getAttribute("data-id");

      try {
        let user;
        if (role === "admin") {
          user = loginUser({ role: "admin", password: "admin123" });
        } else if (role === "staff") {
          user = loginUser({ role: "staff", entityId: id || "staff-1", password: "staff123" });
        } else if (role === "school") {
          user = loginUser({ role: "school", entityId: id || "school-1", password: "school123" });
        }

        state.showLoginModal = false;
        modal?.classList.remove("active");
        showToast(`Logged in as: ${user.name} (${user.title || user.role})`, "success");
        onLoginSuccess(user);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });
}
