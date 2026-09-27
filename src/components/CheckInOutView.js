// Location-Restricted Geofenced Check-In & Check-Out Engine

import L from "leaflet";
import confetti from "canvas-confetti";
import {
  getStaff,
  getSchools,
  getActiveSession,
  checkInTeacher,
  checkOutTeacher,
  getCurriculum,
  addTravelExpense,
  getMapTileConfig
} from "../utils/storage.js";
import {
  calculateDistance,
  checkGeofence,
  formatDistance,
  formatCoords,
  getBrowserLocation,
  getSimulatedCoords
} from "../utils/geo.js";

let checkinMap = null;
let schoolCircle = null;
let userMarker = null;
let schoolMarker = null;
let distanceLine = null;
let timerInterval = null;

export function renderCheckInOutView(state) {
  const staffList = getStaff();
  const schoolList = getSchools();
  const curriculum = getCurriculum();

  // Determine current active staff
  const staffId = state.currentUserRole === "admin" ? staffList[0].id : state.currentUserId;
  const currentStaff = staffList.find((s) => s.id === staffId) || staffList[0];
  const activeSession = getActiveSession(staffId);

  // Selected school (defaults to active session school or first school assigned to staff)
  const defaultSchoolId = activeSession
    ? activeSession.schoolId
    : (currentStaff.assignedSchools && currentStaff.assignedSchools[0]) || schoolList[0].id;

  const currentSchool = schoolList.find((s) => s.id === (state.selectedSchoolId || defaultSchoolId)) || schoolList[0];

  // Current Coordinates (from state or default simulated inside school)
  const userCoords = state.userCoords || {
    lat: currentSchool.lat + 0.00025,
    lng: currentSchool.lng + 0.0002,
    accuracy: 12,
    source: "SIMULATION_INSIDE",
    offsetType: "inside"
  };

  const geoCheck = checkGeofence(
    userCoords.lat,
    userCoords.lng,
    currentSchool.lat,
    currentSchool.lng,
    currentSchool.geofenceRadius
  );

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>📍 Geofenced Attendance & Session Tracker</h2>
        <p>Location-verified check-in & check-out enforced by GPS geofence boundary</p>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <button id="open-travel-request-modal-btn" class="btn btn-outline-cyan">
          🚗 Request Travel Allowance
        </button>
        <span class="status-badge ${geoCheck.isInside ? "badge-verified" : "badge-rejected"}">
          ${geoCheck.isInside ? "✅ WITHIN GEOFENCE" : "❌ OUTSIDE GEOFENCE"}
        </span>
      </div>
    </div>

    <!-- GPS Testing Simulator Bar -->
    <div class="simulator-box">
      <div class="simulator-header">
        <span>🧪 GPS Testing & Simulation Preset Bar (Test inside vs outside geofence):</span>
        <span style="font-size: 0.72rem; color: var(--text-muted);">Current Mode: <strong>${userCoords.source || "SIMULATED"}</strong></span>
      </div>
      <div class="sim-buttons-row">
        <button class="sim-btn ${userCoords.offsetType === "inside" ? "active" : ""}" data-preset="inside">
          🎯 Inside Robotics Lab (~35m)
        </button>
        <button class="sim-btn ${userCoords.offsetType === "gate" ? "active" : ""}" data-preset="gate">
          🚶 At School Gate (~160m)
        </button>
        <button class="sim-btn ${userCoords.offsetType === "outside" ? "active" : ""}" data-preset="outside">
          🚗 Outside Boundary (~850m - BLOCKED)
        </button>
        <button class="sim-btn ${userCoords.offsetType === "far" ? "active" : ""}" data-preset="far">
          ❌ At Home / Far Away (~2.8 km - REJECTED)
        </button>
        <button class="sim-btn" id="use-real-gps-btn" style="border-color: var(--cyan-primary);">
          📡 Use Real Browser GPS
        </button>
      </div>
    </div>

    <div class="checkin-layout-grid">
      <!-- Left Panel: Action Form & Status -->
      <div class="panel-card">
        <div class="panel-card-title">
          <h3>
            <span>🏫 School Check-In Verification</span>
          </h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Teacher: <strong>${currentStaff.name}</strong></span>
        </div>

        <!-- School Selection -->
        <div class="form-group">
          <label class="form-label">Select Destination School (12 Partner Schools):</label>
          <select id="school-select" class="form-control form-select" ${activeSession ? "disabled" : ""}>
            ${schoolList
              .map(
                (sch) => `
              <option value="${sch.id}" ${sch.id === currentSchool.id ? "selected" : ""}>
                ${sch.name} (${sch.geofenceRadius}m geofence)
              </option>
            `
              )
              .join("")}
          </select>
          ${
            activeSession
              ? `<div style="font-size: 0.78rem; color: var(--amber-primary); margin-top: 0.35rem;">⚠️ Cannot change school during an active session. Check out first to switch.</div>`
              : ""
          }
        </div>

        <!-- Geofence Live Status Banner -->
        <div class="geofence-status-card ${geoCheck.isInside ? "verified" : "rejected"}">
          <div class="geofence-status-icon">
            ${geoCheck.isInside ? "📍" : "🚫"}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
              <strong style="font-size: 1.05rem;">
                ${geoCheck.isInside ? "Location Verified: On-Site" : "Out of Range: Check-In Restricted"}
              </strong>
              <span class="status-badge ${geoCheck.isInside ? "badge-verified" : "badge-rejected"}">
                ${geoCheck.isInside ? "ALLOWED" : "BLOCKED"}
              </span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              Distance to <strong>${currentSchool.name}</strong>: 
              <strong style="color: ${geoCheck.isInside ? "var(--emerald-primary)" : "var(--rose-primary)"};">
                ${formatDistance(geoCheck.distanceMeters)}
              </strong> (Geofence Radius: ${currentSchool.geofenceRadius}m)
            </div>

            <div class="distance-bar-wrapper">
              <div class="distance-bar-bg">
                <div class="distance-bar-fill ${geoCheck.isInside ? "safe" : "danger"}" 
                     style="width: ${Math.min(100, Math.max(5, (geoCheck.distanceMeters / (currentSchool.geofenceRadius * 2)) * 100))}%;">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coordinates Details -->
        <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.8rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.72rem;">YOUR DEVICE GPS</div>
            <div style="font-family: var(--font-mono);">${formatCoords(userCoords.lat, userCoords.lng)}</div>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">Accuracy: ±${userCoords.accuracy || 10}m</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.72rem;">SCHOOL PERIMETER</div>
            <div style="font-family: var(--font-mono);">${formatCoords(currentSchool.lat, currentSchool.lng)}</div>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">Allowed Range: ${currentSchool.geofenceRadius} meters</div>
          </div>
        </div>

        <!-- Action Section: Check In or Active Session Controls -->
        ${
          !activeSession
            ? `
          <div style="margin-top: auto;">
            <button id="do-checkin-btn" class="btn ${geoCheck.isInside ? "btn-success" : "btn-secondary"} btn-lg" style="width: 100%;">
              ${geoCheck.isInside ? "✅ Geofenced Check-In Now" : "❌ Cannot Check-In (Outside Geofence)"}
            </button>
            ${
              !geoCheck.isInside
                ? `<div style="text-align: center; font-size: 0.78rem; color: var(--rose-primary); margin-top: 0.5rem;">
                    * You must be within ${currentSchool.geofenceRadius}m of the school campus. Use simulator above to test!
                   </div>`
                : `<div style="text-align: center; font-size: 0.78rem; color: var(--emerald-primary); margin-top: 0.5rem;">
                    * Location matches school campus! Tap to record timestamp and begin robotics session.
                   </div>`
            }
          </div>
        `
            : `
          <div style="margin-top: auto; background: rgba(6, 182, 212, 0.08); border: 1px solid var(--border-highlight); border-radius: var(--radius-md); padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div>
                <div style="font-size: 0.75rem; color: var(--cyan-primary); font-weight: 700; text-transform: uppercase;">SESSION ACTIVE</div>
                <h4 style="font-size: 1.15rem;">${activeSession.schoolName}</h4>
              </div>
              <div class="session-timer-badge" id="checkin-live-timer">
                00:00:00
              </div>
            </div>

            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
              Checked in at <strong>${activeSession.checkInTime}</strong> today.<br>
              GPS Coordinates: <code>${formatCoords(activeSession.checkInLat, activeSession.checkInLng)}</code>
            </div>

            <button id="open-checkout-modal-btn" class="btn btn-warning btn-lg" style="width: 100%;">
              🏁 Check-Out & Submit Topic Log
            </button>
          </div>
        `
        }
      </div>

      <!-- Right Panel: Interactive Leaflet Map with Geofence circle -->
      <div class="panel-card">
        <div class="panel-card-title">
          <h3>🗺️ Real-Time Geofence Map View</h3>
          <span style="font-size: 0.78rem; color: var(--cyan-primary);">Interactive GPS Radar</span>
        </div>

        <div id="checkin-leaflet-map" class="map-container"></div>

        <div style="margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-secondary);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span><span style="color: #6366F1;">🔵</span> School Center</span>
            <span><span style="color: var(--cyan-primary);">⭕</span> Geofence Area (${currentSchool.geofenceRadius}m)</span>
            <span><span style="color: ${geoCheck.isInside ? "var(--emerald-primary)" : "var(--rose-primary)"};">📍</span> Your Device</span>
          </div>
          <button id="recenter-map-btn" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;">
            🎯 Recenter
          </button>
        </div>
      </div>
    </div>

    <!-- Check-Out Modal / Form Dialog -->
    <div id="checkout-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>🏁 Check-Out & Robotics Topic Submission</h3>
          <button class="btn-icon close-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
            Complete your session exit verification. Submit the robotics curriculum topic covered, kit usage, student count, and travel allowance claim.
          </p>

          <form id="checkout-form">
            <div class="form-group">
              <label class="form-label">Robotics Topic / Lesson Taught *</label>
              <input type="text" id="checkout-topic-input" class="form-control" list="curriculum-topics-list" 
                     placeholder="e.g. Module 3: Ultrasonic Obstacle Avoidance & Buzzer" required 
                     value="${currentSchool.currentTopic || ""}">
              <datalist id="curriculum-topics-list">
                ${curriculum
                  .flatMap((c) => c.topics)
                  .map((t) => `<option value="${t}">`)
                  .join("")}
              </datalist>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Class / Grade / Batch *</label>
                <input type="text" id="checkout-batch-input" class="form-control" value="${currentSchool.gradeBatches || "Grade 7 & 8 Robo-Club"}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Number of Students Attended *</label>
                <input type="number" id="checkout-students-input" class="form-control" value="${currentSchool.studentCount || 35}" min="1" max="200" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Session Hours to Claim</label>
                <input type="number" id="checkout-custom-hours" class="form-control" step="0.25" min="0.5" max="10" placeholder="Auto-calculated (e.g. 3.0)" value="3.0">
              </div>

              <div class="form-group">
                <label class="form-label">Kits & Hardware Used</label>
                <input type="text" id="checkout-kits-input" class="form-control" value="${currentSchool.kitsAllocated || "10x Arduino Starter Kits, Ultrasonic Sensors"}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Practical Session Notes / Accomplishments</label>
              <textarea id="checkout-notes-input" class="form-control" rows="2" placeholder="e.g. All student pairs successfully wired the sensor and calibrated distance detection."></textarea>
            </div>

            <!-- Travel Expense Claim Sub-Section: Request-Based (Not Fixed) -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-top: 1rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; font-weight: 700; color: var(--cyan-primary); display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" id="attach-travel-claim" checked>
                  🚗 Request Travel Allowance for this School Visit
                </label>
                <span class="status-badge badge-warning" style="font-size: 0.7rem;">Needs Approval</span>
              </div>

              <div id="travel-claim-fields" class="form-row">
                <div class="form-group">
                  <label class="form-label">Transport Mode</label>
                  <select id="checkout-travel-mode" class="form-control form-select">
                    <option value="Two-Wheeler">🛵 Two-Wheeler (Bike / Scooter)</option>
                    <option value="Cab / Auto (Carrying Kits)">🚗 Cab / Auto (Carrying Kits)</option>
                    <option value="Public Transit">🚆 Metro / Public Bus</option>
                    <option value="Personal Car">🚙 Personal Car</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Estimated Distance (km)</label>
                  <input type="number" id="checkout-travel-dist" class="form-control" value="18" min="1" max="150" placeholder="e.g. 18">
                </div>

                <div class="form-group">
                  <label class="form-label">Requested Allowance (₹) *</label>
                  <input type="number" id="checkout-travel-amount" class="form-control" value="" min="0" placeholder="Enter requested amount (e.g. 180, 320)" required>
                  <div style="font-size: 0.72rem; color: var(--cyan-primary); margin-top: 0.25rem;">
                    💡 No flat allowance allowed — claim is submitted for Director approval based on actual distance / transit tickets
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Travel Justification / Bill Reference</label>
                  <input type="text" id="checkout-travel-notes" class="form-control" placeholder="e.g. Auto fare carrying 4 robotics kit tubs">
                </div>
              </div>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1.25rem;">
              <button type="button" class="btn btn-secondary close-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-success">✅ Confirm Check-Out & Submit Log</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL: Dedicated Standalone Request Travel Allowance Option -->
    <div id="request-travel-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <h3>🚗 Request Travel Allowance</h3>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">Submit a custom travel / transit reimbursement request for Director approval</p>
          </div>
          <button class="btn-icon close-request-travel-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="standalone-travel-request-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Staff / Faculty Member</label>
                <input type="text" class="form-control" value="${currentStaff.name} (${currentStaff.role})" readonly style="background: rgba(255,255,255,0.05); color: var(--text-muted);">
                <input type="hidden" id="req-trv-staff-id" value="${currentStaff.id}">
              </div>

              <div class="form-group">
                <label class="form-label">Destination School Visited *</label>
                <select id="req-trv-school-select" class="form-control form-select" required>
                  ${schoolList
                    .map(
                      (sch) => `
                    <option value="${sch.id}" ${sch.id === currentSchool.id ? "selected" : ""}>
                      ${sch.name}
                    </option>
                  `
                    )
                    .join("")}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date of Travel *</label>
                <input type="date" id="req-trv-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Transport Mode *</label>
                <select id="req-trv-mode" class="form-control form-select">
                  <option value="Two-Wheeler">🛵 Two-Wheeler (Bike / Scooter)</option>
                  <option value="Cab / Auto (Carrying Kits)">🚗 Cab / Auto (Carrying Robotics Kits)</option>
                  <option value="Metro / Train">🚆 Metro / Train</option>
                  <option value="Public Bus">🚌 Public Bus</option>
                  <option value="Personal Car">🚙 Personal Car</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Estimated Distance (km)</label>
                <input type="number" id="req-trv-dist" class="form-control" placeholder="e.g. 20" min="1" max="250">
              </div>

              <div class="form-group">
                <label class="form-label">Requested Allowance Amount (₹) *</label>
                <input type="number" id="req-trv-amount" class="form-control" placeholder="Enter requested amount (e.g. 350)" min="10" required>
                <div style="font-size: 0.72rem; color: var(--cyan-primary); margin-top: 0.25rem;">
                  💡 Allowance is not fixed — request exact transit / fuel cost
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Purpose / Justification / Receipt Ref *</label>
              <textarea id="req-trv-notes" class="form-control" rows="2" placeholder="e.g. Transported 3 sensor kits to campus. Auto bill #8832 attached." required></textarea>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1.25rem;">
              <button type="button" class="btn btn-secondary close-request-travel-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">📤 Submit Travel Request</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function initCheckInMap(container, state, onCoordsUpdate) {
  const mapElement = container.querySelector("#checkin-leaflet-map");
  if (!mapElement) return;

  const schoolList = getSchools();
  const staffList = getStaff();
  const staffId = state.currentUserRole === "admin" ? staffList[0].id : state.currentUserId;
  const currentStaff = staffList.find((s) => s.id === staffId) || staffList[0];
  const activeSession = getActiveSession(staffId);

  const defaultSchoolId = activeSession
    ? activeSession.schoolId
    : (currentStaff.assignedSchools && currentStaff.assignedSchools[0]) || schoolList[0].id;
  const currentSchool = schoolList.find((s) => s.id === (state.selectedSchoolId || defaultSchoolId)) || schoolList[0];

  const userCoords = state.userCoords || {
    lat: currentSchool.lat + 0.00025,
    lng: currentSchool.lng + 0.0002,
    accuracy: 12
  };

  // Clean up existing map instance
  if (checkinMap) {
    checkinMap.remove();
    checkinMap = null;
  }

  // Initialize Leaflet Map
  checkinMap = L.map(mapElement, {
    zoomControl: true,
    attributionControl: false
  }).setView([currentSchool.lat, currentSchool.lng], 16);

  // Dynamic Map Tiles (CartoDB Free / OpenStreetMap / Google / Mapbox)
  const tileConfig = getMapTileConfig(state.theme);
  L.tileLayer(tileConfig.url, {
    maxZoom: tileConfig.maxZoom || 19,
    attribution: tileConfig.attribution
  }).addTo(checkinMap);

  // School Geofence Circle
  schoolCircle = L.circle([currentSchool.lat, currentSchool.lng], {
    color: "#00F0FF",
    fillColor: "#00F0FF",
    fillOpacity: 0.15,
    radius: currentSchool.geofenceRadius,
    weight: 2,
    dashArray: "4, 6"
  }).addTo(checkinMap);

  // School Marker
  const schoolIcon = L.divIcon({
    className: "custom-school-pin",
    html: `<div style="background: #6366F1; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 0 15px rgba(99,102,241,0.6);">🏫</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  schoolMarker = L.marker([currentSchool.lat, currentSchool.lng], { icon: schoolIcon })
    .addTo(checkinMap)
    .bindPopup(`<strong>${currentSchool.name}</strong><br>Radius: ${currentSchool.geofenceRadius}m`);

  // User Device Marker
  const geoCheck = checkGeofence(userCoords.lat, userCoords.lng, currentSchool.lat, currentSchool.lng, currentSchool.geofenceRadius);
  const userPinColor = geoCheck.isInside ? "#10B981" : "#EF4444";

  const userIcon = L.divIcon({
    className: "custom-user-pin",
    html: `<div style="background: ${userPinColor}; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 0 20px ${userPinColor}; animation: pulseGlow 1.5s infinite;">📍</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  userMarker = L.marker([userCoords.lat, userCoords.lng], {
    icon: userIcon,
    draggable: true
  }).addTo(checkinMap).bindPopup(`<strong>Your Device</strong><br>Distance: ${formatDistance(geoCheck.distanceMeters)}`);

  // Distance connecting polyline
  distanceLine = L.polyline(
    [
      [userCoords.lat, userCoords.lng],
      [currentSchool.lat, currentSchool.lng]
    ],
    {
      color: geoCheck.isInside ? "#10B981" : "#EF4444",
      weight: 2,
      dashArray: "5, 5"
    }
  ).addTo(checkinMap);

  // Allow dragging user marker to visually test any location!
  userMarker.on("dragend", (e) => {
    const newPos = e.target.getLatLng();
    const updated = {
      lat: Number(newPos.lat.toFixed(6)),
      lng: Number(newPos.lng.toFixed(6)),
      accuracy: 10,
      source: "MAP_PIN_DRAGGED",
      offsetType: "custom"
    };
    onCoordsUpdate(updated);
  });

  // Fit bounds to show both school and user nicely
  const group = L.featureGroup([schoolCircle, userMarker]);
  checkinMap.fitBounds(group.getBounds().pad(0.3));
}

export function bindCheckInOutEvents(container, state, onRefresh, showToast) {
  const schoolList = getSchools();
  const staffList = getStaff();
  const staffId = state.currentUserRole === "admin" ? staffList[0].id : state.currentUserId;
  const currentStaff = staffList.find((s) => s.id === staffId) || staffList[0];
  const activeSession = getActiveSession(staffId);

  const defaultSchoolId = activeSession
    ? activeSession.schoolId
    : (currentStaff.assignedSchools && currentStaff.assignedSchools[0]) || schoolList[0].id;
  const currentSchool = schoolList.find((s) => s.id === (state.selectedSchoolId || defaultSchoolId)) || schoolList[0];

  // School dropdown change
  const schoolSelect = container.querySelector("#school-select");
  if (schoolSelect) {
    schoolSelect.addEventListener("change", (e) => {
      state.selectedSchoolId = e.target.value;
      const targetSchool = schoolList.find((s) => s.id === state.selectedSchoolId);
      if (targetSchool) {
        // default simulator to inside that school
        state.userCoords = getSimulatedCoords(targetSchool.lat, targetSchool.lng, "inside");
      }
      onRefresh();
    });
  }

  // Simulation preset buttons
  const simButtons = container.querySelectorAll(".sim-btn[data-preset]");
  simButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      state.userCoords = getSimulatedCoords(currentSchool.lat, currentSchool.lng, preset);
      showToast(`GPS set to preset: ${preset.toUpperCase()}`, "info");
      onRefresh();
    });
  });

  // Real Browser GPS button
  const realGpsBtn = container.querySelector("#use-real-gps-btn");
  if (realGpsBtn) {
    realGpsBtn.addEventListener("click", async () => {
      try {
        realGpsBtn.disabled = true;
        realGpsBtn.textContent = "⌛ Acquiring GPS...";
        const realCoords = await getBrowserLocation();
        state.userCoords = realCoords;
        showToast("Device GPS acquired successfully!", "success");
        onRefresh();
      } catch (err) {
        showToast(err.message || "Could not retrieve GPS.", "error");
        realGpsBtn.disabled = false;
        realGpsBtn.textContent = "📡 Use Real Browser GPS";
      }
    });
  }

  // Recenter map button
  const recenterBtn = container.querySelector("#recenter-map-btn");
  if (recenterBtn && checkinMap) {
    recenterBtn.addEventListener("click", () => {
      if (schoolCircle && userMarker) {
        const group = L.featureGroup([schoolCircle, userMarker]);
        checkinMap.fitBounds(group.getBounds().pad(0.3));
      }
    });
  }

  // Check-In Button
  const doCheckInBtn = container.querySelector("#do-checkin-btn");
  if (doCheckInBtn) {
    doCheckInBtn.addEventListener("click", () => {
      const coords = state.userCoords || {
        lat: currentSchool.lat + 0.00025,
        lng: currentSchool.lng + 0.0002
      };

      try {
        const result = checkInTeacher({
          staffId: currentStaff.id,
          schoolId: currentSchool.id,
          userCoords: coords,
          device: coords.source || "Web Browser"
        });

        if (result.success) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
          showToast(`✅ Checked in at ${currentSchool.name}! Robotics session started.`, "success");
          onRefresh();
        } else {
          showToast(result.reason, "error");
          onRefresh();
        }
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  // Live Timer for Active Session
  const liveTimer = container.querySelector("#checkin-live-timer");
  if (liveTimer && activeSession && activeSession.checkInTimestamp) {
    if (timerInterval) clearInterval(timerInterval);
    const updateTime = () => {
      const elapsed = Date.now() - activeSession.checkInTimestamp;
      const s = Math.floor((elapsed / 1000) % 60);
      const m = Math.floor((elapsed / (1000 * 60)) % 60);
      const h = Math.floor(elapsed / (1000 * 60 * 60));
      liveTimer.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };
    updateTime();
    timerInterval = setInterval(() => {
      if (!document.contains(liveTimer)) {
        clearInterval(timerInterval);
        return;
      }
      updateTime();
    }, 1000);
  }

  // Open Checkout Modal
  const openCheckoutBtn = container.querySelector("#open-checkout-modal-btn");
  const checkoutModal = container.querySelector("#checkout-modal");
  if (openCheckoutBtn && checkoutModal) {
    openCheckoutBtn.addEventListener("click", () => {
      checkoutModal.classList.add("active");
    });
  }

  // Close Modal buttons
  const closeBtns = container.querySelectorAll(".close-modal-btn");
  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (checkoutModal) checkoutModal.classList.remove("active");
    });
  });

  // Standalone Request Travel Allowance Modal handlers
  const requestTravelModal = container.querySelector("#request-travel-modal");
  const openTravelReqBtn = container.querySelector("#open-travel-request-modal-btn");
  const closeTravelReqBtns = container.querySelectorAll(".close-request-travel-modal-btn");

  if (openTravelReqBtn && requestTravelModal) {
    openTravelReqBtn.addEventListener("click", () => {
      requestTravelModal.classList.add("active");
    });
  }

  closeTravelReqBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (requestTravelModal) requestTravelModal.classList.remove("active");
    });
  });

  // Standalone Request Travel Form submission
  const standaloneTravelForm = container.querySelector("#standalone-travel-request-form");
  if (standaloneTravelForm) {
    standaloneTravelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const staffId = container.querySelector("#req-trv-staff-id").value;
      const schoolId = container.querySelector("#req-trv-school-select").value;
      const date = container.querySelector("#req-trv-date").value;
      const mode = container.querySelector("#req-trv-mode").value;
      const distanceKm = Number(container.querySelector("#req-trv-dist").value) || 0;
      const amount = Number(container.querySelector("#req-trv-amount").value);
      const notes = container.querySelector("#req-trv-notes").value;

      try {
        addTravelExpense({
          staffId,
          schoolId,
          date,
          mode,
          distanceKm,
          amount,
          notes,
          claimType: "Requested Travel Allowance",
          status: "Pending"
        });

        if (requestTravelModal) requestTravelModal.classList.remove("active");
        standaloneTravelForm.reset();
        showToast(`🚗 Travel allowance request of ₹${amount} submitted! Awaiting Director approval.`, "success");
        onRefresh();
      } catch (err) {
        showToast(err.message || "Failed to submit travel request.", "error");
      }
    });
  }

  // Toggle Travel Claim Fields
  const travelCheck = container.querySelector("#attach-travel-claim");
  const travelFields = container.querySelector("#travel-claim-fields");
  if (travelCheck && travelFields) {
    travelCheck.addEventListener("change", (e) => {
      travelFields.style.display = e.target.checked ? "grid" : "none";
    });
  }

  // Submit Check-Out Form
  const checkoutForm = container.querySelector("#checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const coords = state.userCoords || {
        lat: currentSchool.lat + 0.00025,
        lng: currentSchool.lng + 0.0002
      };

      const sessionDetails = {
        topicTaught: container.querySelector("#checkout-topic-input").value,
        gradeBatch: container.querySelector("#checkout-batch-input").value,
        studentCount: container.querySelector("#checkout-students-input").value,
        customHours: container.querySelector("#checkout-custom-hours").value,
        kitsUsed: container.querySelector("#checkout-kits-input").value,
        sessionNotes: container.querySelector("#checkout-notes-input").value,
        travelClaim: container.querySelector("#attach-travel-claim").checked,
        travelMode: container.querySelector("#checkout-travel-mode")?.value || "Two-Wheeler",
        travelDistanceKm: container.querySelector("#checkout-travel-dist")?.value || 0,
        travelAmount: Number(container.querySelector("#checkout-travel-amount")?.value) || 0,
        travelNotes: container.querySelector("#checkout-travel-notes")?.value || "School visit travel allowance claim",
        travelType: "Visit Travel Allowance"
      };

      try {
        const result = checkOutTeacher({
          staffId: currentStaff.id,
          sessionDetails,
          userCoords: coords,
          device: coords.source || "Web Browser",
          bypassGeofence: false
        });

        if (result.success) {
          if (checkoutModal) checkoutModal.classList.remove("active");
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 }
          });
          showToast(`🏁 Check-out complete! Logged ${result.hours} hours and topic "${sessionDetails.topicTaught}".`, "success");
          onRefresh();
        } else {
          showToast(result.reason, "error");
        }
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }
}
