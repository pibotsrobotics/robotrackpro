import L from "leaflet";
import {
  getSchools,
  getStaff,
  getSessions,
  getKits,
  updateSchool,
  getMapTileConfig,
  formatCurrency
} from "../utils/storage.js";
import { formatSessionWhatsAppText, openWhatsApp, copyTextWithFeedback } from "../utils/whatsapp.js";
import { formatCoords, getBrowserLocation } from "../utils/geo.js";

let portalGpsMap = null;
let portalGpsMarker = null;
let portalGpsCircle = null;

export function renderSchoolPortalView(state) {
  const schools = getSchools();
  const staffList = getStaff();
  const sessions = getSessions();
  const kits = getKits();

  // Selected school id from state.currentUser.schoolId or first school
  const currentSchoolId = state.currentUser?.schoolId || state.selectedSchoolId || "school-1";
  const school = schools.find((s) => s.id === currentSchoolId) || schools[0];

  // Assigned mentors
  const assignedStaff = staffList.filter((st) => school.assignedTeachers.includes(st.id));

  // Sessions at this school
  const schoolSessions = sessions.filter((s) => s.schoolId === school.id);
  const totalHours = schoolSessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
  const totalStudentsTrained = schoolSessions.reduce((sum, s) => sum + (Number(s.studentCount) || 0), 0);

  // Kits stationed at this school
  const stationedKits = [];
  kits.forEach((k) => {
    if (k.currentHolders) {
      const match = k.currentHolders.find((h) => h.holderType === "school" && h.holderId === school.id);
      if (match) {
        stationedKits.push({
          kitName: k.name,
          sku: k.sku,
          units: match.units,
          assignedDate: match.assignedDate,
          components: k.components
        });
      }
    }
  });

  return `
    <div class="view-header">
      <div class="view-title">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 2rem;">🏫</span>
          <div>
            <h2>${school.name} — Robotics Campus Portal</h2>
            <p>Official Institutional Hub • ${school.contactPerson} (${school.phone || "Active Partner"})</p>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <!-- Switch Campus Selector for Demo/Multi-School Coordinator -->
        <select id="portal-school-switcher" class="form-control form-select" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.82rem;">
          ${schools
            .map(
              (sch) => `
            <option value="${sch.id}" ${sch.id === school.id ? "selected" : ""}>
              🏫 ${sch.name}
            </option>
          `
            )
            .join("")}
        </select>
        <button id="portal-request-session-btn" class="btn btn-primary">
          📅 Request Schedule / Visit
        </button>
      </div>
    </div>

    <!-- Campus KPI Stats -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="stat-card" style="border-left: 4px solid var(--cyan-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Delivered Sessions</span>
          <span style="font-size: 1.4rem;">🤖</span>
        </div>
        <div class="stat-value" style="color: var(--cyan-primary);">${schoolSessions.length} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">classes</span></div>
        <div class="stat-meta">${school.scheduleDays.join(" & ")} (${school.preferredTime})</div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--emerald-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Total Lab Hours</span>
          <span style="font-size: 1.4rem;">⏱️</span>
        </div>
        <div class="stat-value" style="color: var(--emerald-primary);">${totalHours.toFixed(1)} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">hrs</span></div>
        <div class="stat-meta">Verified GPS Attendance</div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--indigo-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Students Enrolled</span>
          <span style="font-size: 1.4rem;">👥</span>
        </div>
        <div class="stat-value" style="color: #818CF8;">${school.studentCount || 38} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">students</span></div>
        <div class="stat-meta">${school.gradeBatches}</div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--amber-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Hardware Kits Stationed</span>
          <span style="font-size: 1.4rem;">🧰</span>
        </div>
        <div class="stat-value" style="color: var(--amber-primary);">${stationedKits.reduce((acc, k) => acc + k.units, 0)} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">kits</span></div>
        <div class="stat-meta">Stored on-site in Robotics Lab</div>
      </div>
    </div>

    <!-- Campus Details & Mentor Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <!-- Campus Profile & Geofence Boundary -->
      <div class="panel-card" style="border-top: 3px solid var(--cyan-primary);">
        <div class="panel-card-title">
          <h3>📍 Campus Geofence & Location Profile</h3>
          <span class="status-badge badge-verified">Verified Zone</span>
        </div>

        <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Campus Address:</span>
            <strong style="text-align: right;">${school.address}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Principal / Contact:</span>
            <strong>${school.contactPerson} (${school.phone || "N/A"})</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">GPS Coordinates:</span>
            <code style="font-family: var(--font-mono); color: var(--cyan-primary);">${formatCoords(school.lat, school.lng)}</code>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Geofence Radius:</span>
            <strong>${school.geofenceRadius} meters perimeter</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Batch Details:</span>
            <strong style="color: #6EE7B7;">${school.gradeBatches}</strong>
          </div>
        </div>

        <div style="background: rgba(6,182,212,0.06); border: 1px solid var(--border-highlight); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.8rem;">
          <div style="font-weight: 700; color: var(--cyan-primary); margin-bottom: 0.2rem;">CURRENT SYLLABUS TOPIC</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">${school.currentTopic || "Module 1: Foundations of Electronics & Circuitry"}</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 0.25rem;">Next Scheduled Session: ${school.scheduleDays[0] || "Next visit"} at ${school.preferredTime}</div>
        </div>

        <div style="margin-top: 0.75rem;">
          <button id="portal-calibrate-gps-btn" class="btn btn-outline-cyan btn-sm" style="width: 100%;">
            📍 Calibrate Campus GPS & Geofence
          </button>
        </div>
      </div>

      <!-- Assigned Robotics Mentor Profile -->
      <div class="panel-card" style="border-top: 3px solid var(--emerald-primary);">
        <div class="panel-card-title">
          <h3>👨‍🏫 Assigned Robotics Faculty</h3>
          <span class="status-badge badge-info">${assignedStaff.length} Lead Mentor(s)</span>
        </div>

        ${
          assignedStaff.length === 0
            ? `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No mentor currently assigned to this campus.</div>`
            : assignedStaff
                .map(
                  (staff) => `
          <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.75rem;">
              <span style="font-size: 2.2rem; background: rgba(255,255,255,0.05); width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md);">${staff.avatar}</span>
              <div>
                <h4 style="font-size: 1.15rem; color: var(--text-primary); margin: 0;">${staff.name}</h4>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${staff.role}</div>
                <div style="font-size: 0.74rem; color: var(--cyan-primary); margin-top: 0.15rem;">${staff.specialty}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.78rem; padding: 0.6rem 0; border-top: 1px dashed rgba(255,255,255,0.08); border-bottom: 1px dashed rgba(255,255,255,0.08);">
              <div>📧 ${staff.email}</div>
              <div>📞 ${staff.phone}</div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <a href="tel:${staff.phone}" class="btn btn-outline-cyan btn-sm" style="flex: 1; text-align: center; text-decoration: none;">
                📞 Call Mentor
              </a>
              <button class="btn btn-secondary btn-sm mentor-whatsapp-btn" data-phone="${staff.phone}" data-name="${staff.name}" style="flex: 1;">
                💬 WhatsApp
              </button>
            </div>
          </div>
        `
                )
                .join("")
        }

        <!-- On-Site Stationed Hardware Kits -->
        <div style="margin-top: 1rem;">
          <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">
            Stationed Robotics Kits on Campus (${stationedKits.length})
          </div>
          ${
            stationedKits.length === 0
              ? `<div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic;">Traveling kit model: Faculty brings hardware for each hands-on lab.</div>`
              : stationedKits
                  .map(
                    (k) => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 0.45rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.78rem;">
              <span>🧰 <strong>${k.kitName}</strong> (${k.sku})</span>
              <span class="status-badge badge-success">${k.units} units stationed</span>
            </div>
          `
                  )
                  .join("")
          }
        </div>
      </div>
    </div>

    <!-- Sessions Delivered at this School -->
    <div class="table-card">
      <div class="table-header-toolbar">
        <div>
          <h3>📋 Robotics Session Logs for ${school.name} (${schoolSessions.length})</h3>
          <p style="font-size: 0.76rem; color: var(--text-secondary);">Verified on-site robotics sessions conducted for your student batches</p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Lead Mentor</th>
              <th>Robotics Topic Taught</th>
              <th>Batch</th>
              <th>Hours</th>
              <th>Students</th>
              <th>Hardware Kits Used</th>
              <th>Verification</th>
              <th style="text-align: center;">Report</th>
            </tr>
          </thead>
          <tbody>
            ${
              schoolSessions.length === 0
                ? `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">No sessions recorded yet for this campus.</td></tr>`
                : schoolSessions
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
                <td style="max-width: 260px;">
                  <strong style="color: var(--cyan-primary);">${s.topicTaught}</strong>
                  ${s.sessionNotes ? `<div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 0.2rem;">${s.sessionNotes}</div>` : ""}
                </td>
                <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${s.gradeBatch}</span></td>
                <td><span class="status-badge badge-info">${s.hours} hrs</span></td>
                <td><strong>${s.studentCount || "--"}</strong></td>
                <td style="font-size: 0.76rem; color: var(--text-secondary); max-width: 180px;">${s.kitsUsed || "Robotics Experimenter Pod"}</td>
                <td><span class="status-badge badge-verified">✅ Verified</span></td>
                <td style="text-align: center;">
                  <button class="btn btn-outline-cyan btn-sm portal-share-session-btn" data-session-id="${s.id}" title="Share Session Report to WhatsApp">
                    📱 Share
                  </button>
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

    <!-- MODAL: Request Schedule / Lab Support -->
    <div id="school-request-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>📅 Request Schedule Adjustment / Robotics Support</h3>
          <button class="btn-icon close-portal-request-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="school-request-form">
            <div class="form-group">
              <label class="form-label">School</label>
              <input type="text" class="form-control" value="${school.name}" readonly style="opacity: 0.85;" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Preferred Date</label>
                <input type="date" id="req-date" class="form-control" required value="${new Date().toISOString().split("T")[0]}" />
              </div>

              <div class="form-group">
                <label class="form-label">Preferred Time Slot</label>
                <select id="req-time" class="form-control form-select">
                  <option value="09:00 - 12:00">Morning Session (09:00 - 12:00)</option>
                  <option value="13:00 - 16:00">Afternoon Session (13:00 - 16:00)</option>
                  <option value="Full Day STEM Fair">Full Day Robotics Exhibition / Competition</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Topic / Kit Focus</label>
              <input type="text" id="req-topic" class="form-control" placeholder="e.g. Line Follower Rover Competition Prep or IoT Workshop" required />
            </div>

            <div class="form-group">
              <label class="form-label">Special Notes / Hardware Requirements</label>
              <textarea id="req-notes" class="form-control" rows="3" placeholder="Provide any details for the Academy Director & Mentor..."></textarea>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-portal-request-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Send Request to Academy Director</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Campus GPS & Geofence Calibration Modal -->
    <div id="portal-set-gps-modal" class="modal-overlay">
      <div class="modal-dialog" style="max-width: 740px;">
        <div class="modal-header">
          <div>
            <h3>📍 Calibrate Campus GPS & Geofence</h3>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">${school.name} • Pinpoint robotics lab or school gate</p>
          </div>
          <button class="btn-icon close-portal-gps-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">
              🎯 Drag the marker or click on map to position school center:
            </span>
            <button type="button" id="portal-detect-gps-btn" class="btn btn-outline-cyan btn-sm">
              📡 Detect My Current Device GPS
            </button>
          </div>

          <div id="portal-set-gps-interactive-map" style="height: 320px; width: 100%; border-radius: var(--radius-md); border: 1px solid var(--border-highlight); margin-bottom: 1.25rem;"></div>

          <form id="portal-set-gps-form">
            <input type="hidden" id="portal-gps-school-id" value="${school.id}" />

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Campus Center Latitude *</label>
                <input type="number" id="portal-gps-lat" class="form-control" step="0.000001" value="${school.lat}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Campus Center Longitude *</label>
                <input type="number" id="portal-gps-lng" class="form-control" step="0.000001" value="${school.lng}" required />
              </div>
            </div>

            <div class="form-group" style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label class="form-label" style="margin: 0; font-weight: 700; color: var(--cyan-primary);">
                  ⭕ Geofence Perimeter Radius
                </label>
                <span id="portal-gps-radius-display" style="font-weight: 700; font-size: 0.95rem; color: var(--cyan-primary); font-family: var(--font-mono);">
                  ${school.geofenceRadius} meters
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <input type="range" id="portal-gps-radius-range" min="50" max="1500" step="10" value="${school.geofenceRadius}" style="flex: 1; accent-color: var(--cyan-primary); cursor: pointer;" />
                <input type="number" id="portal-gps-radius-val" class="form-control" min="50" max="1500" step="10" value="${school.geofenceRadius}" style="width: 100px; text-align: center; font-weight: 700;" />
              </div>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 0.5rem;">
              <button type="button" class="btn btn-secondary close-portal-gps-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-success">💾 Save & Calibrate Campus GPS</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function bindSchoolPortalEvents(container, state, onRefresh, showToast) {
  const sessions = getSessions();

  // School Switcher
  const switcher = container.querySelector("#portal-school-switcher");
  if (switcher) {
    switcher.addEventListener("change", (e) => {
      state.selectedSchoolId = e.target.value;
      if (state.currentUser && state.currentUser.role === "school") {
        state.currentUser.schoolId = e.target.value;
      }
      onRefresh();
    });
  }

  // Request Modal
  const requestBtn = container.querySelector("#portal-request-session-btn");
  const modal = container.querySelector("#school-request-modal");
  const closeBtns = container.querySelectorAll(".close-portal-request-btn");

  if (requestBtn && modal) {
    requestBtn.addEventListener("click", () => modal.classList.add("active"));
  }
  closeBtns.forEach((btn) => btn.addEventListener("click", () => modal.classList.remove("active")));

  // Submit Request
  const form = container.querySelector("#school-request-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const topic = container.querySelector("#req-topic").value;
      const date = container.querySelector("#req-date").value;
      modal.classList.remove("active");
      showToast(`Request for "${topic}" on ${date} submitted to Academy Director!`, "success");
    });
  }

  // Mentor WhatsApp
  const mentorWaBtns = container.querySelectorAll(".mentor-whatsapp-btn");
  mentorWaBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const phone = btn.getAttribute("data-phone");
      const name = btn.getAttribute("data-name");
      const text = `Hello ${name}! Reaching out from the school campus regarding our upcoming robotics schedule.`;
      openWhatsApp(text, phone);
    });
  });

  // Share session from portal
  const shareBtns = container.querySelectorAll(".portal-share-session-btn");
  shareBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sessId = btn.getAttribute("data-session-id");
      const sess = sessions.find((s) => s.id === sessId);
      if (sess) {
        const text = formatSessionWhatsAppText(sess);
        openWhatsApp(text);
        showToast("Opening WhatsApp with session report...", "info");
      }
    });
  });

  // Campus GPS Calibration Modal triggers
  const portalGpsModal = container.querySelector("#portal-set-gps-modal");
  const openPortalGpsBtn = container.querySelector("#portal-calibrate-gps-btn");
  const closePortalGpsBtns = container.querySelectorAll(".close-portal-gps-modal-btn");

  closePortalGpsBtns.forEach((btn) => {
    btn.addEventListener("click", () => portalGpsModal?.classList.remove("active"));
  });

  if (openPortalGpsBtn && portalGpsModal) {
    openPortalGpsBtn.addEventListener("click", () => {
      const schools = getSchools();
      const currentSchoolId = state.currentUser?.schoolId || state.selectedSchoolId || "school-1";
      const sch = schools.find((s) => s.id === currentSchoolId) || schools[0];

      portalGpsModal.classList.add("active");

      const mapContainer = container.querySelector("#portal-set-gps-interactive-map");
      const latInput = container.querySelector("#portal-gps-lat");
      const lngInput = container.querySelector("#portal-gps-lng");
      const radiusRange = container.querySelector("#portal-gps-radius-range");
      const radiusVal = container.querySelector("#portal-gps-radius-val");
      const radiusDisplay = container.querySelector("#portal-gps-radius-display");

      latInput.value = Number(sch.lat).toFixed(6);
      lngInput.value = Number(sch.lng).toFixed(6);
      radiusRange.value = sch.geofenceRadius || 250;
      radiusVal.value = sch.geofenceRadius || 250;
      radiusDisplay.textContent = `${sch.geofenceRadius || 250} meters`;

      if (mapContainer) {
        if (portalGpsMap) {
          portalGpsMap.remove();
          portalGpsMap = null;
        }

        portalGpsMap = L.map(mapContainer).setView([sch.lat, sch.lng], 16);

        const tileConfig = getMapTileConfig(state.theme);
        L.tileLayer(tileConfig.url, {
          maxZoom: tileConfig.maxZoom || 19,
          attribution: tileConfig.attribution
        }).addTo(portalGpsMap);

        portalGpsCircle = L.circle([sch.lat, sch.lng], {
          color: "#00F0FF",
          fillColor: "#00F0FF",
          fillOpacity: 0.18,
          radius: sch.geofenceRadius || 250,
          weight: 2,
          dashArray: "4, 6"
        }).addTo(portalGpsMap);

        const pin = L.divIcon({
          className: "portal-gps-pin",
          html: `<div style="background: #00F0FF; color: #080B11; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 0 20px #00F0FF;">🏫</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        portalGpsMarker = L.marker([sch.lat, sch.lng], {
          icon: pin,
          draggable: true
        }).addTo(portalGpsMap);

        portalGpsMarker.on("drag", (e) => {
          const pos = e.target.getLatLng();
          portalGpsCircle.setLatLng(pos);
          latInput.value = pos.lat.toFixed(6);
          lngInput.value = pos.lng.toFixed(6);
        });

        portalGpsMap.on("click", (e) => {
          portalGpsMarker.setLatLng(e.latlng);
          portalGpsCircle.setLatLng(e.latlng);
          latInput.value = e.latlng.lat.toFixed(6);
          lngInput.value = e.latlng.lng.toFixed(6);
        });

        const updateRadius = (newRadius) => {
          const r = Number(newRadius) || 250;
          radiusRange.value = r;
          radiusVal.value = r;
          radiusDisplay.textContent = `${r} meters`;
          if (portalGpsCircle) portalGpsCircle.setRadius(r);
        };

        radiusRange.oninput = (e) => updateRadius(e.target.value);
        radiusVal.oninput = (e) => updateRadius(e.target.value);

        setTimeout(() => {
          if (portalGpsMap) portalGpsMap.invalidateSize();
        }, 250);
      }
    });
  }

  // Detect GPS in Portal GPS Modal
  const portalGpsDetectBtn = container.querySelector("#portal-detect-gps-btn");
  if (portalGpsDetectBtn) {
    portalGpsDetectBtn.addEventListener("click", async () => {
      try {
        portalGpsDetectBtn.disabled = true;
        portalGpsDetectBtn.textContent = "⌛ Acquiring GPS...";
        const coords = await getBrowserLocation();
        const latInput = container.querySelector("#portal-gps-lat");
        const lngInput = container.querySelector("#portal-gps-lng");
        latInput.value = coords.lat.toFixed(6);
        lngInput.value = coords.lng.toFixed(6);
        if (portalGpsMarker && portalGpsCircle && portalGpsMap) {
          portalGpsMarker.setLatLng([coords.lat, coords.lng]);
          portalGpsCircle.setLatLng([coords.lat, coords.lng]);
          portalGpsMap.setView([coords.lat, coords.lng], 17);
        }
        showToast("Device GPS acquired! School center placed at current position.", "success");
      } catch (err) {
        showToast(err.message || "Could not retrieve GPS.", "error");
      } finally {
        portalGpsDetectBtn.disabled = false;
        portalGpsDetectBtn.textContent = "📡 Detect My Current Device GPS";
      }
    });
  }

  // Submit Portal Set GPS form
  const portalSetGpsForm = container.querySelector("#portal-set-gps-form");
  if (portalSetGpsForm) {
    portalSetGpsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const schoolId = container.querySelector("#portal-gps-school-id").value;
      const lat = Number(container.querySelector("#portal-gps-lat").value);
      const lng = Number(container.querySelector("#portal-gps-lng").value);
      const geofenceRadius = Number(container.querySelector("#portal-gps-radius-val").value);

      const updated = updateSchool(schoolId, { lat, lng, geofenceRadius });
      if (portalGpsModal) portalGpsModal.classList.remove("active");
      showToast(`📍 Campus GPS calibrated successfully for ${updated.name}!`, "success");
      onRefresh();
    });
  }
}
