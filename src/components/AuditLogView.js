// Geolocation Audit Trail & Check-In/Out Attempt Inspector

import L from "leaflet";
import { getAuditLogs, getSchools, getStaff, getMapTileConfig } from "../utils/storage.js";
import { formatCoords, formatDistance } from "../utils/geo.js";

let auditInspectMap = null;

export function renderAuditLogView(state) {
  const auditLogs = getAuditLogs();
  const staffList = getStaff();
  const schools = getSchools();

  const filterStatus = state.auditFilterStatus || "all";
  const filterStaff = state.auditFilterStaff || "all";

  const filteredLogs = auditLogs.filter((log) => {
    if (filterStatus !== "all" && log.status !== filterStatus) return false;
    if (filterStaff !== "all" && log.staffId !== filterStaff) return false;
    return true;
  });

  const verifiedCount = auditLogs.filter((l) => l.status === "VERIFIED").length;
  const rejectedCount = auditLogs.filter((l) => l.status === "REJECTED_OUT_OF_RANGE").length;

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>🛰️ Geofence Audit & Attempt Inspector</h2>
        <p>Review exact GPS coordinates logged during check-in & check-out attempts across schools</p>
      </div>

      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <span class="status-badge badge-verified">✅ ${verifiedCount} Verified</span>
        <span class="status-badge badge-rejected">❌ ${rejectedCount} Rejected (Out of Range)</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="table-card">
      <div class="table-header-toolbar">
        <div>
          <h3>GPS Attempt Register (${filteredLogs.length} Records)</h3>
          <p style="font-size: 0.76rem; color: var(--text-secondary);">Every click of Check-In/Out captures device lat/long vs school perimeter</p>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <select id="audit-filter-status" class="form-control form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8rem;">
            <option value="all">All Statuses (${auditLogs.length})</option>
            <option value="VERIFIED" ${filterStatus === "VERIFIED" ? "selected" : ""}>Only Verified On-Site</option>
            <option value="REJECTED_OUT_OF_RANGE" ${filterStatus === "REJECTED_OUT_OF_RANGE" ? "selected" : ""}>Only Rejected (Out of Range)</option>
          </select>

          <select id="audit-filter-staff" class="form-control form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8rem;">
            <option value="all">All Teachers</option>
            ${staffList.map((st) => `<option value="${st.id}" ${filterStaff === st.id ? "selected" : ""}>${st.name}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Teacher</th>
              <th>Action</th>
              <th>Target School</th>
              <th>Attempt GPS (Device)</th>
              <th>Distance to Campus</th>
              <th>Geofence Limit</th>
              <th>Result Status</th>
              <th>Map Audit</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredLogs.length === 0
                ? `<tr><td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No audit attempts matching filters.</td></tr>`
                : filteredLogs
                    .map(
                      (log) => `
              <tr>
                <td>
                  <div style="font-family: var(--font-mono); font-weight: 600; font-size: 0.82rem;">
                    ${new Date(log.timestamp).toLocaleDateString()}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">
                    ${new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </td>
                <td><strong>${log.staffName}</strong></td>
                <td>
                  <span class="status-badge ${log.action === "CHECK_IN" ? "badge-info" : "badge-pending"}">
                    ${log.action === "CHECK_IN" ? "📥 Check-In" : "📤 Check-Out"}
                  </span>
                </td>
                <td>
                  <div style="font-weight: 600;">${log.schoolName}</div>
                </td>
                <td>
                  <code style="font-size: 0.74rem; font-family: var(--font-mono);">${formatCoords(log.attemptLat, log.attemptLng)}</code>
                </td>
                <td>
                  <strong style="color: ${log.status === "VERIFIED" ? "var(--emerald-primary)" : "var(--rose-primary)"};">
                    ${formatDistance(log.distanceMeters)}
                  </strong>
                </td>
                <td><span style="font-size: 0.78rem; color: var(--text-secondary);">${log.geofenceRadius}m</span></td>
                <td>
                  <span class="status-badge ${log.status === "VERIFIED" ? "badge-verified" : "badge-rejected"}">
                    ${log.status === "VERIFIED" ? "✅ Verified" : "❌ Rejected (Too Far)"}
                  </span>
                </td>
                <td>
                  <button class="btn btn-outline-cyan btn-sm inspect-log-btn" data-id="${log.id}">
                    🔍 Inspect
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

    <!-- Map Inspection Modal -->
    <div id="audit-inspect-modal" class="modal-overlay">
      <div class="modal-dialog" style="max-width: 720px;">
        <div class="modal-header">
          <h3>🛰️ GPS Location Attempt Verification</h3>
          <button class="btn-icon close-audit-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <div id="audit-inspect-details" style="margin-bottom: 1rem; font-size: 0.88rem; line-height: 1.6;">
            <!-- Populated dynamically -->
          </div>
          <div id="audit-inspect-map" class="map-container" style="height: 350px;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary close-audit-modal-btn">Close</button>
        </div>
      </div>
    </div>
  `;
}

export function bindAuditLogEvents(container, state, onRefresh) {
  const statusFilter = container.querySelector("#audit-filter-status");
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      state.auditFilterStatus = e.target.value;
      onRefresh();
    });
  }

  const staffFilter = container.querySelector("#audit-filter-staff");
  if (staffFilter) {
    staffFilter.addEventListener("change", (e) => {
      state.auditFilterStaff = e.target.value;
      onRefresh();
    });
  }

  // Modal handlers
  const inspectModal = container.querySelector("#audit-inspect-modal");
  const inspectDetails = container.querySelector("#audit-inspect-details");
  const closeBtns = container.querySelectorAll(".close-audit-modal-btn");
  closeBtns.forEach((btn) => btn.addEventListener("click", () => inspectModal.classList.remove("active")));

  const inspectBtns = container.querySelectorAll(".inspect-log-btn");
  inspectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const logId = btn.getAttribute("data-id");
      const logs = getAuditLogs();
      const log = logs.find((l) => l.id === logId);
      if (!log) return;

      inspectDetails.innerHTML = `
        <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-subtle); display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.74rem;">TEACHER & ACTION</div>
            <strong>${log.staffName}</strong> • ${log.action}<br>
            <span style="font-size: 0.76rem; color: var(--text-secondary);">${new Date(log.timestamp).toLocaleString()}</span>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.74rem;">TARGET SCHOOL</div>
            <strong>${log.schoolName}</strong><br>
            <span style="font-size: 0.76rem; color: var(--text-secondary);">Radius Limit: ${log.geofenceRadius} meters</span>
          </div>
          <div style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.6rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                Distance Deviation: <strong style="color: ${log.status === "VERIFIED" ? "var(--emerald-primary)" : "var(--rose-primary)"};">${formatDistance(log.distanceMeters)}</strong>
              </div>
              <span class="status-badge ${log.status === "VERIFIED" ? "badge-verified" : "badge-rejected"}">
                ${log.status === "VERIFIED" ? "✅ Verified Inside Geofence" : "❌ Rejected: Outside Geofence"}
              </span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.3rem;">
              <em>${log.notes || ""}</em>
            </div>
          </div>
        </div>
      `;

      inspectModal.classList.add("active");

      // Render map inside modal
      setTimeout(() => {
        const mapEl = container.querySelector("#audit-inspect-map");
        if (!mapEl) return;
        if (auditInspectMap) {
          auditInspectMap.remove();
          auditInspectMap = null;
        }

        auditInspectMap = L.map(mapEl, { attributionControl: false }).setView([log.schoolLat, log.schoolLng], 15);
        const tileConfig = getMapTileConfig(state.theme);
        L.tileLayer(tileConfig.url, { maxZoom: tileConfig.maxZoom || 19, attribution: tileConfig.attribution }).addTo(auditInspectMap);

        // School Geofence Circle
        const circle = L.circle([log.schoolLat, log.schoolLng], {
          color: "#00F0FF",
          fillColor: "#00F0FF",
          fillOpacity: 0.15,
          radius: log.geofenceRadius,
          weight: 2
        }).addTo(auditInspectMap);

        // School marker
        const schoolIcon = L.divIcon({
          html: `<div style="background:#6366F1;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;">🏫</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        const schoolMark = L.marker([log.schoolLat, log.schoolLng], { icon: schoolIcon }).addTo(auditInspectMap).bindPopup(log.schoolName);

        // User attempt marker
        const userColor = log.status === "VERIFIED" ? "#10B981" : "#EF4444";
        const userIcon = L.divIcon({
          html: `<div style="background:${userColor};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        const userMark = L.marker([log.attemptLat, log.attemptLng], { icon: userIcon })
          .addTo(auditInspectMap)
          .bindPopup(`<strong>Attempt Point</strong><br>${formatDistance(log.distanceMeters)} from campus`);

        // Connect line
        L.polyline([[log.attemptLat, log.attemptLng], [log.schoolLat, log.schoolLng]], {
          color: userColor,
          dashArray: "4, 6",
          weight: 2
        }).addTo(auditInspectMap);

        const group = L.featureGroup([circle, userMark, schoolMark]);
        auditInspectMap.fitBounds(group.getBounds().pad(0.3));
      }, 150);
    });
  });
}
