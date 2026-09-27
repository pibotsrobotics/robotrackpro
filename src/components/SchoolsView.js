// 12 Partner Schools Management & Multi-Campus Map View with Full CRUD

import L from "leaflet";
import {
  getSchools,
  getStaff,
  saveSchools,
  addSchool,
  updateSchool,
  deleteSchool,
  getSessions,
  getMapTileConfig
} from "../utils/storage.js";
import { formatCoords, getBrowserLocation } from "../utils/geo.js";

let schoolsOverviewMap = null;
let setGpsMap = null;
let setGpsMarker = null;
let setGpsCircle = null;

export function renderSchoolsView(state) {
  const schools = getSchools();
  const staffList = getStaff();
  const sessions = getSessions();
  const isAdmin = state.currentUser?.role === "admin";

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>🏫 Partner Schools Directory (${schools.length} Schools)</h2>
        <p>Campus coordinates, geofence perimeters, assigned robotics instructors & syllabus coverage</p>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${
          isAdmin
            ? `<button id="add-school-modal-btn" class="btn btn-primary">
                ➕ Register New School
              </button>`
            : ""
        }
      </div>
    </div>

    <!-- Multi-School Interactive Map -->
    <div class="panel-card" style="margin-bottom: 2rem;">
      <div class="panel-card-title">
        <h3>🗺️ Multi-Campus Geofence Fleet Map</h3>
        <span style="font-size: 0.8rem; color: var(--cyan-primary);">${schools.length} Robotics Partner Campuses</span>
      </div>
      <div id="all-schools-leaflet-map" class="map-container" style="height: 420px;"></div>
    </div>

    <!-- Schools Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.25rem;">
      ${schools
        .map((sch) => {
          const assignedStaff = staffList.filter((st) => sch.assignedTeachers.includes(st.id));
          const schoolSessions = sessions.filter((s) => s.schoolId === sch.id);
          const totalHoursAtSchool = schoolSessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);

          return `
          <div class="panel-card" style="border-top: 3px solid var(--indigo-primary); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <h3 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.2rem;">${sch.name}</h3>
                  <div style="font-size: 0.78rem; color: var(--text-secondary);">📍 ${sch.address}</div>
                </div>
                <span class="status-badge badge-info">
                  🎯 ${sch.geofenceRadius}m Radius
                </span>
              </div>

              <!-- School Meta Grid -->
              <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.8rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.4rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Assigned Teachers:</span>
                  <strong style="color: var(--cyan-primary);">${assignedStaff.map((s) => s.name).join(", ") || "Unassigned"}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Schedule Slots:</span>
                  <strong>${sch.scheduleDays.join(" & ")} (${sch.preferredTime})</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Batches & Students:</span>
                  <strong>${sch.gradeBatches} • ${sch.studentCount || 30} students</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">GPS Coordinates:</span>
                  <code style="font-family: var(--font-mono); font-size: 0.74rem;">${formatCoords(sch.lat, sch.lng)}</code>
                </div>
              </div>

              <!-- Current Syllabus Topic Progress -->
              <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid var(--border-highlight); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.82rem;">
                <div style="font-size: 0.7rem; color: var(--cyan-primary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.2rem;">Current Topic Progress:</div>
                <strong style="color: var(--text-primary);">${sch.currentTopic || "Module 1: Foundations"}</strong>
                <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 0.2rem;">Kits: ${sch.kitsAllocated || "Standard Robotics Lab Pod"}</div>
              </div>
            </div>

            <!-- Footer Stats & Actions -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); margin-bottom: 0.5rem;">
                <div style="font-size: 0.78rem; color: var(--text-muted);">
                  <strong>${schoolSessions.length}</strong> sessions (${totalHoursAtSchool.toFixed(1)} hrs taught)
                </div>
                <button class="btn btn-secondary btn-sm jump-to-checkin-btn" data-school="${sch.id}">
                  Check In Here →
                </button>
              </div>

              <!-- Dedicated School GPS Setting Button -->
              <div style="margin-bottom: 0.5rem;">
                <button class="btn btn-outline-cyan btn-sm set-school-gps-btn" data-id="${sch.id}" style="width: 100%;">
                  📍 Set School GPS & Geofence
                </button>
              </div>

              ${
                isAdmin
                  ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.08);">
                      <button class="btn btn-secondary btn-sm edit-school-btn" data-id="${sch.id}">
                        ✏️ Edit Campus
                      </button>
                      <button class="btn btn-danger btn-sm delete-school-btn" data-id="${sch.id}" data-name="${sch.name}">
                        🗑️ Delete School
                      </button>
                    </div>`
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("")}
    </div>

    <!-- MODAL 1: Register New School (Create) -->
    <div id="add-school-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>🏫 Register New Partner School</h3>
          <button class="btn-icon close-school-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="new-school-form">
            <div class="form-group">
              <label class="form-label">School Name *</label>
              <input type="text" id="new-school-name" class="form-control" placeholder="e.g. Greenwood Tech Magnet School" required>
            </div>

            <div class="form-group">
              <label class="form-label">Campus Address *</label>
              <input type="text" id="new-school-address" class="form-control" placeholder="e.g. 55 Innovation Way, South Zone" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Contact Person (Principal / HOD)</label>
                <input type="text" id="new-school-contact" class="form-control" placeholder="e.g. Dr. Arthur Pendelton">
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="new-school-phone" class="form-control" placeholder="+91 98765 43210">
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; margin-bottom: 0.25rem;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--cyan-primary);">📍 GPS Coordinates & Geofence:</span>
              <button type="button" id="new-school-gps-detect-btn" class="btn btn-outline-cyan btn-xs" style="padding: 2px 8px; font-size: 11px;">
                📡 Use My Current GPS
              </button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Latitude (GPS) *</label>
                <input type="number" id="new-school-lat" class="form-control" step="0.00001" placeholder="13.0827" value="13.0800" required>
              </div>

              <div class="form-group">
                <label class="form-label">Longitude (GPS) *</label>
                <input type="number" id="new-school-lng" class="form-control" step="0.00001" placeholder="80.2707" value="80.2700" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Geofence Radius (Meters) *</label>
                <input type="number" id="new-school-radius" class="form-control" value="250" min="50" max="1000" required>
              </div>

              <div class="form-group">
                <label class="form-label">Assign Primary Teacher</label>
                <select id="new-school-teacher" class="form-control form-select">
                  ${staffList.map((st) => `<option value="${st.id}">${st.name}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Schedule Days (Comma separated)</label>
                <input type="text" id="new-school-days" class="form-control" value="Monday, Thursday">
              </div>

              <div class="form-group">
                <label class="form-label">Grade Batches</label>
                <input type="text" id="new-school-batches" class="form-control" value="Grade 6 to 8 (RoboClub)">
              </div>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-school-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save School</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Edit School (Update) -->
    <div id="edit-school-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>✏️ Edit Partner School Campus</h3>
          <button class="btn-icon close-edit-school-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-school-form">
            <input type="hidden" id="edit-school-id" />

            <div class="form-group">
              <label class="form-label">School Name *</label>
              <input type="text" id="edit-school-name" class="form-control" required />
            </div>

            <div class="form-group">
              <label class="form-label">Campus Address *</label>
              <input type="text" id="edit-school-address" class="form-control" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Contact Person</label>
                <input type="text" id="edit-school-contact" class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="edit-school-phone" class="form-control" />
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; margin-bottom: 0.25rem;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--cyan-primary);">📍 GPS Coordinates & Geofence:</span>
              <button type="button" id="edit-school-gps-detect-btn" class="btn btn-outline-cyan btn-xs" style="padding: 2px 8px; font-size: 11px;">
                📡 Use My Current GPS
              </button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Latitude *</label>
                <input type="number" id="edit-school-lat" class="form-control" step="0.00001" required />
              </div>

              <div class="form-group">
                <label class="form-label">Longitude *</label>
                <input type="number" id="edit-school-lng" class="form-control" step="0.00001" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Geofence Radius (Meters) *</label>
                <input type="number" id="edit-school-radius" class="form-control" min="50" max="1500" required />
              </div>

              <div class="form-group">
                <label class="form-label">Student Enrollments</label>
                <input type="number" id="edit-school-students" class="form-control" min="5" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Schedule Days</label>
                <input type="text" id="edit-school-days" class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label">Preferred Time Slot</label>
                <input type="text" id="edit-school-time" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Grade Batches</label>
              <input type="text" id="edit-school-batches" class="form-control" />
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-edit-school-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Update School</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Dedicated Interactive School GPS & Geofence Calibration Modal -->
    <div id="set-gps-modal" class="modal-overlay">
      <div class="modal-dialog" style="max-width: 740px;">
        <div class="modal-header">
          <div>
            <h3 id="set-gps-modal-title">📍 Set School GPS & Geofence</h3>
            <p id="set-gps-modal-subtitle" style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">Drag pin on map or detect current device GPS</p>
          </div>
          <button class="btn-icon close-gps-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <!-- Helpful Action Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">
              🎯 <strong>Drag the pin</strong> or <strong>click anywhere</strong> on the map to set school GPS:
            </span>
            <button type="button" id="set-gps-detect-btn" class="btn btn-outline-cyan btn-sm">
              📡 Detect My Current Device GPS
            </button>
          </div>

          <!-- Interactive Leaflet Map for Calibration -->
          <div id="set-gps-interactive-map" style="height: 320px; width: 100%; border-radius: var(--radius-md); border: 1px solid var(--border-highlight); margin-bottom: 1.25rem;"></div>

          <form id="set-gps-form">
            <input type="hidden" id="set-gps-school-id" />

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Campus Center Latitude *</label>
                <input type="number" id="set-gps-lat" class="form-control" step="0.000001" required />
              </div>

              <div class="form-group">
                <label class="form-label">Campus Center Longitude *</label>
                <input type="number" id="set-gps-lng" class="form-control" step="0.000001" required />
              </div>
            </div>

            <div class="form-group" style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label class="form-label" style="margin: 0; font-weight: 700; color: var(--cyan-primary);">
                  ⭕ Geofence Perimeter Radius
                </label>
                <span id="set-gps-radius-display" style="font-weight: 700; font-size: 0.95rem; color: var(--cyan-primary); font-family: var(--font-mono);">
                  250 meters
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <input type="range" id="set-gps-radius-range" min="50" max="1500" step="10" value="250" style="flex: 1; accent-color: var(--cyan-primary); cursor: pointer;" />
                <input type="number" id="set-gps-radius-val" class="form-control" min="50" max="1500" step="10" value="250" style="width: 100px; text-align: center; font-weight: 700;" />
              </div>
              <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 0.35rem;">
                * Attendance verification requires staff to be within this perimeter of the school campus GPS coordinate.
              </div>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 0.5rem;">
              <button type="button" class="btn btn-secondary close-gps-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-success">💾 Save & Calibrate Campus GPS</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function initSchoolsMap(container, state) {
  const mapEl = container.querySelector("#all-schools-leaflet-map");
  if (!mapEl) return;

  const schools = getSchools();
  if (schools.length === 0) return;

  if (schoolsOverviewMap) {
    schoolsOverviewMap.remove();
    schoolsOverviewMap = null;
  }

  schoolsOverviewMap = L.map(mapEl).setView([schools[0].lat, schools[0].lng], 12);

  const tileConfig = getMapTileConfig(state.theme);
  L.tileLayer(tileConfig.url, {
    maxZoom: tileConfig.maxZoom || 19,
    attribution: tileConfig.attribution
  }).addTo(schoolsOverviewMap);

  const markers = [];

  schools.forEach((sch) => {
    // Geofence Circle
    L.circle([sch.lat, sch.lng], {
      color: "#00F0FF",
      fillColor: "#00F0FF",
      fillOpacity: 0.12,
      radius: sch.geofenceRadius,
      weight: 1.5
    }).addTo(schoolsOverviewMap);

    // Custom School Pin
    const pin = L.divIcon({
      className: "school-fleet-pin",
      html: `<div style="background: #6366F1; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 0 12px rgba(99,102,241,0.6);">🏫</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([sch.lat, sch.lng], { icon: pin })
      .addTo(schoolsOverviewMap)
      .bindPopup(`
        <div style="min-width: 170px;">
          <strong style="font-size: 13px;">${sch.name}</strong><br>
          <span style="font-size: 11px; color: #94A3B8;">📍 Radius: ${sch.geofenceRadius}m Perimeter</span><br>
          <span style="font-size: 11px; color: #00F0FF;">${sch.currentTopic || "Robotics Lab"}</span><br>
          <button class="btn btn-outline-cyan btn-xs set-school-gps-popup-btn" data-id="${sch.id}" style="margin-top: 6px; width: 100%; font-size: 11px; padding: 3px 8px;">
            📍 Set School GPS
          </button>
        </div>
      `);

    markers.push(marker);
  });

  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    schoolsOverviewMap.fitBounds(group.getBounds().pad(0.2));
  }
}

export function bindSchoolsEvents(container, state, onNavigateCheckin, onRefresh, showToast) {
  // Jump to checkin buttons
  const jumpBtns = container.querySelectorAll(".jump-to-checkin-btn");
  jumpBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const schoolId = btn.getAttribute("data-school");
      onNavigateCheckin(schoolId);
    });
  });

  // Create Modal handlers
  const addModal = container.querySelector("#add-school-modal");
  const openModalBtn = container.querySelector("#add-school-modal-btn");
  const closeBtns = container.querySelectorAll(".close-school-modal-btn");

  if (openModalBtn && addModal) openModalBtn.addEventListener("click", () => addModal.classList.add("active"));
  closeBtns.forEach((btn) => btn.addEventListener("click", () => addModal.classList.remove("active")));

  // Submit new school
  const form = container.querySelector("#new-school-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = container.querySelector("#new-school-name").value;
      const address = container.querySelector("#new-school-address").value;
      const contactPerson = container.querySelector("#new-school-contact").value;
      const phone = container.querySelector("#new-school-phone").value;
      const lat = Number(container.querySelector("#new-school-lat").value);
      const lng = Number(container.querySelector("#new-school-lng").value);
      const geofenceRadius = Number(container.querySelector("#new-school-radius").value);
      const teacher = container.querySelector("#new-school-teacher").value;
      const days = container.querySelector("#new-school-days").value.split(",").map((d) => d.trim());
      const batches = container.querySelector("#new-school-batches").value;

      addSchool({
        name,
        address,
        contactPerson,
        phone,
        lat,
        lng,
        geofenceRadius,
        assignedTeachers: [teacher],
        scheduleDays: days,
        gradeBatches: batches,
        studentCount: 30
      });

      addModal.classList.remove("active");
      showToast(`School "${name}" registered successfully!`, "success");
      onRefresh();
    });
  }

  // Edit School handlers
  const editModal = container.querySelector("#edit-school-modal");
  const closeEditBtns = container.querySelectorAll(".close-edit-school-modal-btn");
  closeEditBtns.forEach((btn) => btn.addEventListener("click", () => editModal.classList.remove("active")));

  const editBtns = container.querySelectorAll(".edit-school-btn");
  editBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const schoolId = btn.getAttribute("data-id");
      const sch = getSchools().find((s) => s.id === schoolId);
      if (!sch) return;

      container.querySelector("#edit-school-id").value = sch.id;
      container.querySelector("#edit-school-name").value = sch.name;
      container.querySelector("#edit-school-address").value = sch.address;
      container.querySelector("#edit-school-contact").value = sch.contactPerson || "";
      container.querySelector("#edit-school-phone").value = sch.phone || "";
      container.querySelector("#edit-school-lat").value = sch.lat;
      container.querySelector("#edit-school-lng").value = sch.lng;
      container.querySelector("#edit-school-radius").value = sch.geofenceRadius;
      container.querySelector("#edit-school-students").value = sch.studentCount || 30;
      container.querySelector("#edit-school-days").value = sch.scheduleDays.join(", ");
      container.querySelector("#edit-school-time").value = sch.preferredTime || "09:00 - 12:00";
      container.querySelector("#edit-school-batches").value = sch.gradeBatches || "";

      editModal.classList.add("active");
    });
  });

  // Submit Edit School
  const editForm = container.querySelector("#edit-school-form");
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const schoolId = container.querySelector("#edit-school-id").value;
      const name = container.querySelector("#edit-school-name").value;
      const address = container.querySelector("#edit-school-address").value;
      const contactPerson = container.querySelector("#edit-school-contact").value;
      const phone = container.querySelector("#edit-school-phone").value;
      const lat = Number(container.querySelector("#edit-school-lat").value);
      const lng = Number(container.querySelector("#edit-school-lng").value);
      const geofenceRadius = Number(container.querySelector("#edit-school-radius").value);
      const studentCount = Number(container.querySelector("#edit-school-students").value);
      const days = container.querySelector("#edit-school-days").value.split(",").map((d) => d.trim());
      const preferredTime = container.querySelector("#edit-school-time").value;
      const gradeBatches = container.querySelector("#edit-school-batches").value;

      updateSchool(schoolId, {
        name,
        address,
        contactPerson,
        phone,
        lat,
        lng,
        geofenceRadius,
        studentCount,
        scheduleDays: days,
        preferredTime,
        gradeBatches
      });

      editModal.classList.remove("active");
      showToast(`Updated campus details for ${name}!`, "success");
      onRefresh();
    });
  }

  // Delete School
  const deleteBtns = container.querySelectorAll(".delete-school-btn");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const schoolId = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      if (confirm(`Are you sure you want to delete "${name}" from partner schools? This will remove its campus entry.`)) {
        deleteSchool(schoolId);
        showToast(`School "${name}" deleted.`, "info");
        onRefresh();
      }
    });
  });

  // GPS Calibration Modal Logic
  const setGpsModal = container.querySelector("#set-gps-modal");
  const closeGpsBtns = container.querySelectorAll(".close-gps-modal-btn");
  closeGpsBtns.forEach((btn) => btn.addEventListener("click", () => setGpsModal?.classList.remove("active")));

  const openSetGpsModal = (schoolId) => {
    const schools = getSchools();
    const sch = schools.find((s) => s.id === schoolId);
    if (!sch || !setGpsModal) return;

    container.querySelector("#set-gps-school-id").value = sch.id;
    container.querySelector("#set-gps-modal-title").textContent = `📍 Set GPS: ${sch.name}`;
    container.querySelector("#set-gps-modal-subtitle").textContent = `Campus: ${sch.address} • Drag pin or click map to set center`;
    
    const latInput = container.querySelector("#set-gps-lat");
    const lngInput = container.querySelector("#set-gps-lng");
    const radiusRange = container.querySelector("#set-gps-radius-range");
    const radiusVal = container.querySelector("#set-gps-radius-val");
    const radiusDisplay = container.querySelector("#set-gps-radius-display");

    latInput.value = Number(sch.lat).toFixed(6);
    lngInput.value = Number(sch.lng).toFixed(6);
    radiusRange.value = sch.geofenceRadius || 250;
    radiusVal.value = sch.geofenceRadius || 250;
    radiusDisplay.textContent = `${sch.geofenceRadius || 250} meters`;

    setGpsModal.classList.add("active");

    // Initialize Leaflet Calibration Map
    const mapContainer = container.querySelector("#set-gps-interactive-map");
    if (mapContainer) {
      if (setGpsMap) {
        setGpsMap.remove();
        setGpsMap = null;
      }

      setGpsMap = L.map(mapContainer).setView([sch.lat, sch.lng], 16);

      const tileConfig = getMapTileConfig(state.theme);
      L.tileLayer(tileConfig.url, {
        maxZoom: tileConfig.maxZoom || 19,
        attribution: tileConfig.attribution
      }).addTo(setGpsMap);

      // Circle geofence
      setGpsCircle = L.circle([sch.lat, sch.lng], {
        color: "#00F0FF",
        fillColor: "#00F0FF",
        fillOpacity: 0.18,
        radius: sch.geofenceRadius || 250,
        weight: 2,
        dashArray: "4, 6"
      }).addTo(setGpsMap);

      // Custom Draggable School Pin
      const schoolPin = L.divIcon({
        className: "set-gps-school-pin",
        html: `<div style="background: #00F0FF; color: #080B11; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 0 20px #00F0FF;">🏫</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      setGpsMarker = L.marker([sch.lat, sch.lng], {
        icon: schoolPin,
        draggable: true
      }).addTo(setGpsMap);

      // Marker drag event
      setGpsMarker.on("drag", (e) => {
        const pos = e.target.getLatLng();
        setGpsCircle.setLatLng(pos);
        latInput.value = pos.lat.toFixed(6);
        lngInput.value = pos.lng.toFixed(6);
      });

      // Map click event
      setGpsMap.on("click", (e) => {
        setGpsMarker.setLatLng(e.latlng);
        setGpsCircle.setLatLng(e.latlng);
        latInput.value = e.latlng.lat.toFixed(6);
        lngInput.value = e.latlng.lng.toFixed(6);
      });

      // Slider & number input dynamic circle sync
      const updateRadius = (newRadius) => {
        const r = Number(newRadius) || 250;
        radiusRange.value = r;
        radiusVal.value = r;
        radiusDisplay.textContent = `${r} meters`;
        if (setGpsCircle) setGpsCircle.setRadius(r);
      };

      radiusRange.oninput = (e) => updateRadius(e.target.value);
      radiusVal.oninput = (e) => updateRadius(e.target.value);

      // Manual Lat/Lng coordinate edit sync
      const onManualCoordChange = () => {
        const lat = Number(latInput.value);
        const lng = Number(lngInput.value);
        if (!isNaN(lat) && !isNaN(lng)) {
          setGpsMarker.setLatLng([lat, lng]);
          setGpsCircle.setLatLng([lat, lng]);
          setGpsMap.panTo([lat, lng]);
        }
      };
      latInput.onchange = onManualCoordChange;
      lngInput.onchange = onManualCoordChange;

      // Invalidate size once visible in DOM
      setTimeout(() => {
        if (setGpsMap) setGpsMap.invalidateSize();
      }, 250);
    }
  };

  // Bind Set GPS card buttons
  const setGpsBtns = container.querySelectorAll(".set-school-gps-btn");
  setGpsBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openSetGpsModal(id);
    });
  });

  // Popup click listener for fleet map "Set School GPS" popup buttons
  const popupClickHandler = (e) => {
    const target = e.target.closest(".set-school-gps-popup-btn");
    if (target) {
      const id = target.getAttribute("data-id");
      openSetGpsModal(id);
    }
  };
  document.removeEventListener("click", container._popupClickHandler);
  container._popupClickHandler = popupClickHandler;
  document.addEventListener("click", popupClickHandler);

  // Detect GPS button in Set GPS modal
  const setGpsDetectBtn = container.querySelector("#set-gps-detect-btn");
  if (setGpsDetectBtn) {
    setGpsDetectBtn.addEventListener("click", async () => {
      try {
        setGpsDetectBtn.disabled = true;
        setGpsDetectBtn.textContent = "⌛ Acquiring GPS...";
        const coords = await getBrowserLocation();
        const latInput = container.querySelector("#set-gps-lat");
        const lngInput = container.querySelector("#set-gps-lng");
        latInput.value = coords.lat.toFixed(6);
        lngInput.value = coords.lng.toFixed(6);
        if (setGpsMarker && setGpsCircle && setGpsMap) {
          setGpsMarker.setLatLng([coords.lat, coords.lng]);
          setGpsCircle.setLatLng([coords.lat, coords.lng]);
          setGpsMap.setView([coords.lat, coords.lng], 17);
        }
        showToast("Device GPS acquired! School center placed at current position.", "success");
      } catch (err) {
        showToast(err.message || "Could not retrieve GPS.", "error");
      } finally {
        setGpsDetectBtn.disabled = false;
        setGpsDetectBtn.textContent = "📡 Detect My Current Device GPS";
      }
    });
  }

  // Submit Set GPS form
  const setGpsForm = container.querySelector("#set-gps-form");
  if (setGpsForm) {
    setGpsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const schoolId = container.querySelector("#set-gps-school-id").value;
      const lat = Number(container.querySelector("#set-gps-lat").value);
      const lng = Number(container.querySelector("#set-gps-lng").value);
      const geofenceRadius = Number(container.querySelector("#set-gps-radius-val").value);

      const updated = updateSchool(schoolId, { lat, lng, geofenceRadius });
      if (setGpsModal) setGpsModal.classList.remove("active");
      showToast(`📍 GPS coordinates & geofence updated for ${updated.name}!`, "success");
      onRefresh();
    });
  }

  // Detect GPS in Add School form
  const newGpsDetectBtn = container.querySelector("#new-school-gps-detect-btn");
  if (newGpsDetectBtn) {
    newGpsDetectBtn.addEventListener("click", async () => {
      try {
        newGpsDetectBtn.disabled = true;
        newGpsDetectBtn.textContent = "⌛ Acquiring GPS...";
        const coords = await getBrowserLocation();
        container.querySelector("#new-school-lat").value = coords.lat.toFixed(6);
        container.querySelector("#new-school-lng").value = coords.lng.toFixed(6);
        showToast("Applied device GPS to new school coordinates!", "success");
      } catch (err) {
        showToast(err.message || "Could not retrieve GPS.", "error");
      } finally {
        newGpsDetectBtn.disabled = false;
        newGpsDetectBtn.textContent = "📡 Use My Current GPS";
      }
    });
  }

  // Detect GPS in Edit School form
  const editGpsDetectBtn = container.querySelector("#edit-school-gps-detect-btn");
  if (editGpsDetectBtn) {
    editGpsDetectBtn.addEventListener("click", async () => {
      try {
        editGpsDetectBtn.disabled = true;
        editGpsDetectBtn.textContent = "⌛ Acquiring GPS...";
        const coords = await getBrowserLocation();
        container.querySelector("#edit-school-lat").value = coords.lat.toFixed(6);
        container.querySelector("#edit-school-lng").value = coords.lng.toFixed(6);
        showToast("Applied device GPS to school coordinates!", "success");
      } catch (err) {
        showToast(err.message || "Could not retrieve GPS.", "error");
      } finally {
        editGpsDetectBtn.disabled = false;
        editGpsDetectBtn.textContent = "📡 Use My Current GPS";
      }
    });
  }
}
