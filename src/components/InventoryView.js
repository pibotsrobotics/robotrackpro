// Robotics Hardware & Kit Inventory Management Component with Full CRUD

import {
  getKits,
  getStaff,
  getSchools,
  addKit,
  updateKit,
  deleteKit,
  checkoutKit,
  returnKit,
  saveKits
} from "../utils/storage.js";

export function renderInventoryView(state) {
  const kits = getKits();
  const staffList = getStaff();
  const schools = getSchools();
  const isAdmin = state.currentUser?.role === "admin";

  // Metrics
  const totalKits = kits.reduce((acc, k) => acc + (k.totalUnits || 0), 0);
  const totalDeployed = kits.reduce((acc, k) => acc + (k.deployedCount || 0), 0);
  const totalTransit = kits.reduce((acc, k) => acc + (k.inTransitCount || 0), 0);
  const totalBaseLab = kits.reduce((acc, k) => acc + (k.baseLabCount || 0), 0);
  const totalMaintenance = kits.reduce((acc, k) => acc + (k.maintenanceCount || 0), 0);

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>📦 Robotics Hardware & Kit Inventory</h2>
        <p>Real-time tracking of microcontrollers, rovers, sensors, robotic arms, and lab dispatches across 12 schools</p>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${
          isAdmin
            ? `<button id="inventory-add-kit-btn" class="btn btn-primary">
                ➕ Register New Hardware Kit
              </button>`
            : ""
        }
      </div>
    </div>

    <!-- Inventory Overview KPI Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="stat-card" style="border-left: 4px solid var(--cyan-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Total Hardware Assets</span>
          <span style="font-size: 1.4rem;">🧰</span>
        </div>
        <div class="stat-value" style="color: var(--cyan-primary);">${totalKits} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">units</span></div>
        <div class="stat-meta">Across ${kits.length} specialized kit models</div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--emerald-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Available in Base Lab</span>
          <span style="font-size: 1.4rem;">🏢</span>
        </div>
        <div class="stat-value" style="color: var(--emerald-primary);">${totalBaseLab} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">ready</span></div>
        <div class="stat-meta">In stock & calibrated for dispatch</div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--indigo-primary);">
        <div class="stat-card-header">
          <span class="stat-label">In Transit with Teachers</span>
          <span style="font-size: 1.4rem;">🛵</span>
        </div>
        <div class="stat-value" style="color: #818CF8;">${totalTransit} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">units</span></div>
        <div class="stat-meta">Carried by mentors for sessions</div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--amber-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Stationed at Schools</span>
          <span style="font-size: 1.4rem;">🏫</span>
        </div>
        <div class="stat-value" style="color: var(--amber-primary);">${totalDeployed} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">units</span></div>
        <div class="stat-meta">In partner school robotics labs</div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--rose-primary);">
        <div class="stat-card-header">
          <span class="stat-label">Under Maintenance</span>
          <span style="font-size: 1.4rem;">🛠️</span>
        </div>
        <div class="stat-value" style="color: var(--rose-primary);">${totalMaintenance} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">units</span></div>
        <div class="stat-meta">${totalMaintenance > 0 ? `${totalMaintenance} units need servo/sensor calibration` : "All units operational"}</div>
      </div>
    </div>

    <!-- Kits Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
      ${kits
        .map((kit) => {
          const availPct = Math.round(((kit.baseLabCount || 0) / (kit.totalUnits || 1)) * 100);
          const transitPct = Math.round(((kit.inTransitCount || 0) / (kit.totalUnits || 1)) * 100);
          const deployedPct = Math.round(((kit.deployedCount || 0) / (kit.totalUnits || 1)) * 100);

          return `
          <div class="panel-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--cyan-primary); text-transform: uppercase; letter-spacing: 0.05em;">
                    ${kit.sku} • ${kit.category}
                  </span>
                  <h3 style="font-size: 1.15rem; margin-top: 0.2rem; color: var(--text-primary);">${kit.name}</h3>
                </div>
                <span class="status-badge ${kit.maintenanceCount > 0 ? "badge-warning" : "badge-success"}">
                  ${kit.condition ? kit.condition.split(" ")[0] : "Good"}
                </span>
              </div>

              <!-- Distribution Bar -->
              <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.35rem;">
                  <span style="color: var(--text-secondary);">Stock Allocation (${kit.totalUnits} total):</span>
                  <span><strong>${kit.baseLabCount}</strong> Lab / <strong>${kit.inTransitCount || 0}</strong> Transit / <strong>${kit.deployedCount || 0}</strong> School</span>
                </div>
                <div style="height: 8px; width: 100%; background: rgba(255,255,255,0.06); border-radius: var(--radius-full); overflow: hidden; display: flex;">
                  <div style="width: ${availPct}%; background: var(--emerald-primary);" title="${kit.baseLabCount} in Base Lab"></div>
                  <div style="width: ${transitPct}%; background: #6366F1;" title="${kit.inTransitCount} in Transit"></div>
                  <div style="width: ${deployedPct}%; background: var(--amber-primary);" title="${kit.deployedCount} Deployed in Schools"></div>
                </div>
              </div>

              <!-- Included Components -->
              <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1rem;">
                <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem;">
                  Hardware Components Included
                </div>
                <div style="font-size: 0.78rem; color: var(--text-primary); line-height: 1.45;">
                  ${kit.components}
                </div>
              </div>

              <!-- Current Custodians -->
              <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.4rem;">
                  Current Assignments & Custody
                </div>
                ${
                  !kit.currentHolders || kit.currentHolders.length === 0
                    ? `<div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic;">All units stored in central Base Lab.</div>`
                    : `<div style="display: flex; flex-direction: column; gap: 0.35rem;">
                        ${kit.currentHolders
                          .map(
                            (h) => `
                          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; background: rgba(255,255,255,0.03); padding: 0.35rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.04);">
                            <span>
                              ${h.holderType === "teacher" ? "👨‍🏫" : "🏫"} 
                              <strong>${h.holderName}</strong>
                              <span style="color: var(--text-muted); margin-left: 0.3rem;">(${h.assignedDate})</span>
                            </span>
                            <span class="status-badge badge-info" style="font-size: 0.7rem; padding: 0.1rem 0.45rem;">
                              ${h.units} units
                            </span>
                          </div>
                        `
                          )
                          .join("")}
                      </div>`
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
                <button class="btn btn-outline-cyan btn-sm trigger-checkout-kit-btn" data-kit-id="${kit.id}" ${kit.baseLabCount <= 0 ? "disabled title='No units in lab'" : ""}>
                  📤 Dispatch
                </button>
                <button class="btn btn-secondary btn-sm trigger-return-kit-btn" data-kit-id="${kit.id}" ${(!kit.currentHolders || kit.currentHolders.length === 0) ? "disabled title='No active dispatches'" : ""}>
                  📥 Return
                </button>
              </div>

              ${
                isAdmin
                  ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed rgba(255,255,255,0.08);">
                      <button class="btn btn-secondary btn-sm trigger-edit-kit-btn" data-kit-id="${kit.id}">
                        ✏️ Edit Kit
                      </button>
                      <button class="btn btn-danger btn-sm trigger-delete-kit-btn" data-kit-id="${kit.id}" data-name="${kit.name}">
                        🗑️ Delete
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

    <!-- MODAL 1: Create New Kit -->
    <div id="add-kit-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>📦 Register New Hardware Kit</h3>
          <button class="btn-icon close-kit-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="add-kit-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Kit Name *</label>
                <input type="text" id="add-kit-name" class="form-control" placeholder="e.g. Raspberry Pi 5 AI Vision Lab" required />
              </div>

              <div class="form-group">
                <label class="form-label">SKU / Code *</label>
                <input type="text" id="add-kit-sku" class="form-control" placeholder="e.g. KIT-RPI-07" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select id="add-kit-category" class="form-control form-select">
                  <option value="Microcontrollers">Microcontrollers (Arduino/ESP32)</option>
                  <option value="Mobile Robotics">Mobile Robotics & Rovers</option>
                  <option value="Manipulators & Kinematics">Manipulators & Robotic Arms</option>
                  <option value="IoT & Wireless">IoT, Wi-Fi & Bluetooth</option>
                  <option value="Artificial Intelligence">AI Vision & Machine Perception</option>
                  <option value="Consumables & Modules">Sensors & Electronics Assortment</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Total Units *</label>
                <input type="number" id="add-kit-units" class="form-control" value="10" min="1" max="100" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Hardware Components List *</label>
              <textarea id="add-kit-components" class="form-control" rows="2" placeholder="List boards, motors, shields, and cables included..." required></textarea>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-kit-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Kit to Inventory</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Edit Kit -->
    <div id="edit-kit-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>✏️ Edit Hardware Kit</h3>
          <button class="btn-icon close-edit-kit-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-kit-form">
            <input type="hidden" id="edit-kit-id" />

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Kit Name *</label>
                <input type="text" id="edit-kit-name" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label">SKU</label>
                <input type="text" id="edit-kit-sku" class="form-control" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Total Inventory Units</label>
                <input type="number" id="edit-kit-total-units" class="form-control" min="1" required />
              </div>

              <div class="form-group">
                <label class="form-label">Condition Rating</label>
                <select id="edit-kit-condition" class="form-control form-select">
                  <option value="Excellent (100%)">Excellent (100%)</option>
                  <option value="Good (95%)">Good (95%)</option>
                  <option value="Servos Calibrated">Servos Calibrated</option>
                  <option value="Needs Jumper Replacements">Needs Jumper Replacements</option>
                  <option value="Requires Maintenance">Requires Maintenance</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Components Summary</label>
              <textarea id="edit-kit-components" class="form-control" rows="2"></textarea>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-edit-kit-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Kit</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Dispatch / Check-Out Kit -->
    <div id="checkout-kit-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>📤 Dispatch / Check-Out Robotics Hardware Kit</h3>
          <button class="btn-icon close-kit-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="checkout-kit-form">
            <input type="hidden" id="modal-checkout-kit-id" />

            <div class="form-group">
              <label class="form-label">Kit Selected</label>
              <input type="text" id="modal-checkout-kit-name" class="form-control" readonly style="opacity: 0.85; font-weight: 600;" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Recipient / Custodian Type *</label>
                <select id="modal-checkout-type" class="form-control form-select">
                  <option value="teacher">👨‍🏫 Traveling Teacher / Mentor</option>
                  <option value="school">🏫 Partner School Robotics Lab</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Assignee Name *</label>
                <select id="modal-checkout-recipient" class="form-control form-select">
                  <!-- Dynamically populated -->
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Units to Dispatch *</label>
                <input type="number" id="modal-checkout-units" class="form-control" value="2" min="1" max="20" required />
                <div id="modal-available-hint" style="font-size: 0.72rem; color: var(--emerald-primary); margin-top: 0.25rem;"></div>
              </div>

              <div class="form-group">
                <label class="form-label">Dispatch Purpose</label>
                <input type="text" id="modal-checkout-notes" class="form-control" placeholder="e.g. For Grade 7 Autonomous Rover Lab" />
              </div>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-kit-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Confirm Dispatch</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 4: Return Kit to Base Lab -->
    <div id="return-kit-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>📥 Return Hardware Kit to Central Lab</h3>
          <button class="btn-icon close-kit-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="return-kit-form">
            <input type="hidden" id="modal-return-kit-id" />

            <div class="form-group">
              <label class="form-label">Kit Selected</label>
              <input type="text" id="modal-return-kit-name" class="form-control" readonly style="opacity: 0.85; font-weight: 600;" />
            </div>

            <div class="form-group">
              <label class="form-label">Returning Custodian *</label>
              <select id="modal-return-holder-select" class="form-control form-select">
                <!-- Dynamically populated -->
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Units Returning *</label>
                <input type="number" id="modal-return-units" class="form-control" value="1" min="1" required />
              </div>

              <div class="form-group">
                <label class="form-label">Returned Condition Rating</label>
                <select id="modal-return-condition" class="form-control form-select">
                  <option value="Excellent (100%)">✅ Excellent (All components intact & tested)</option>
                  <option value="Good (95%)">✔️ Good (Minor wear, fully functional)</option>
                  <option value="Needs Jumper / Battery Refill">⚠️ Minor Consumables Needed (Jumpers/Cells)</option>
                  <option value="Needs Servo / Motor Repair">🛠️ Requires Maintenance (Damaged motor/servo)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Inspection & Check-In Notes</label>
              <input type="text" id="modal-return-notes" class="form-control" placeholder="e.g. Returned after competition, tested OK" />
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-kit-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-success">Confirm Return & Restock</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function bindInventoryEvents(container, state, onRefresh, showToast) {
  const kits = getKits();
  const staffList = getStaff();
  const schools = getSchools();

  // Close modals
  const closeBtns = container.querySelectorAll(".close-kit-modal-btn, .close-edit-kit-modal-btn");
  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelector("#checkout-kit-modal")?.classList.remove("active");
      container.querySelector("#return-kit-modal")?.classList.remove("active");
      container.querySelector("#add-kit-modal")?.classList.remove("active");
      container.querySelector("#edit-kit-modal")?.classList.remove("active");
    });
  });

  // Add Kit Modal trigger
  const addKitBtn = container.querySelector("#inventory-add-kit-btn");
  const addKitModal = container.querySelector("#add-kit-modal");
  if (addKitBtn && addKitModal) {
    addKitBtn.addEventListener("click", () => addKitModal.classList.add("active"));
  }

  // Submit Add Kit
  const addKitForm = container.querySelector("#add-kit-form");
  if (addKitForm) {
    addKitForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = container.querySelector("#add-kit-name").value;
      const sku = container.querySelector("#add-kit-sku").value;
      const category = container.querySelector("#add-kit-category").value;
      const totalUnits = Number(container.querySelector("#add-kit-units").value);
      const components = container.querySelector("#add-kit-components").value;

      addKit({
        name,
        sku,
        category,
        totalUnits,
        components
      });

      addKitModal.classList.remove("active");
      showToast(`Hardware kit "${name}" added to inventory!`, "success");
      onRefresh();
    });
  }

  // Edit Kit Modal trigger
  const editKitBtns = container.querySelectorAll(".trigger-edit-kit-btn");
  const editKitModal = container.querySelector("#edit-kit-modal");
  editKitBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kitId = btn.getAttribute("data-kit-id");
      const kit = getKits().find((k) => k.id === kitId);
      if (!kit) return;

      container.querySelector("#edit-kit-id").value = kit.id;
      container.querySelector("#edit-kit-name").value = kit.name;
      container.querySelector("#edit-kit-sku").value = kit.sku;
      container.querySelector("#edit-kit-total-units").value = kit.totalUnits;
      container.querySelector("#edit-kit-condition").value = kit.condition || "Excellent (100%)";
      container.querySelector("#edit-kit-components").value = kit.components || "";

      editKitModal.classList.add("active");
    });
  });

  // Submit Edit Kit
  const editKitForm = container.querySelector("#edit-kit-form");
  if (editKitForm) {
    editKitForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const kitId = container.querySelector("#edit-kit-id").value;
      const name = container.querySelector("#edit-kit-name").value;
      const sku = container.querySelector("#edit-kit-sku").value;
      const totalUnits = Number(container.querySelector("#edit-kit-total-units").value);
      const condition = container.querySelector("#edit-kit-condition").value;
      const components = container.querySelector("#edit-kit-components").value;

      updateKit(kitId, {
        name,
        sku,
        totalUnits,
        condition,
        components
      });

      editKitModal.classList.remove("active");
      showToast(`Updated hardware kit details for ${name}!`, "success");
      onRefresh();
    });
  }

  // Delete Kit
  const deleteKitBtns = container.querySelectorAll(".trigger-delete-kit-btn");
  deleteKitBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kitId = btn.getAttribute("data-kit-id");
      const name = btn.getAttribute("data-name");
      if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
        deleteKit(kitId);
        showToast(`Hardware kit "${name}" removed from inventory.`, "info");
        onRefresh();
      }
    });
  });

  // Check-Out Modal Trigger
  const checkoutBtns = container.querySelectorAll(".trigger-checkout-kit-btn");
  const checkoutModal = container.querySelector("#checkout-kit-modal");
  checkoutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kitId = btn.getAttribute("data-kit-id");
      const kit = getKits().find((k) => k.id === kitId);
      if (!kit) return;

      container.querySelector("#modal-checkout-kit-id").value = kit.id;
      container.querySelector("#modal-checkout-kit-name").value = `${kit.sku} - ${kit.name}`;
      container.querySelector("#modal-available-hint").textContent = `${kit.baseLabCount} units currently available in Base Lab`;
      container.querySelector("#modal-checkout-units").max = kit.baseLabCount;
      container.querySelector("#modal-checkout-units").value = Math.min(2, kit.baseLabCount);

      // Populate recipient select
      updateRecipientDropdown(container.querySelector("#modal-checkout-type").value);
      checkoutModal.classList.add("active");
    });
  });

  // Change recipient type
  const typeSelect = container.querySelector("#modal-checkout-type");
  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      updateRecipientDropdown(e.target.value);
    });
  }

  function updateRecipientDropdown(type) {
    const recipientSelect = container.querySelector("#modal-checkout-recipient");
    if (!recipientSelect) return;

    if (type === "teacher") {
      recipientSelect.innerHTML = staffList
        .map((s) => `<option value="${s.id}" data-name="${s.name}">👨‍🏫 ${s.name} (${s.role.split(" ")[0]})</option>`)
        .join("");
    } else {
      recipientSelect.innerHTML = schools
        .map((sch) => `<option value="${sch.id}" data-name="${sch.name}">🏫 ${sch.name}</option>`)
        .join("");
    }
  }

  // Submit Check-Out Form
  const checkoutForm = container.querySelector("#checkout-kit-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const kitId = container.querySelector("#modal-checkout-kit-id").value;
      const holderType = container.querySelector("#modal-checkout-type").value;
      const recipientSelect = container.querySelector("#modal-checkout-recipient");
      const holderId = recipientSelect.value;
      const selectedOption = recipientSelect.options[recipientSelect.selectedIndex];
      const holderName = selectedOption.getAttribute("data-name") || selectedOption.textContent;
      const units = Number(container.querySelector("#modal-checkout-units").value);
      const notes = container.querySelector("#modal-checkout-notes").value;

      try {
        checkoutKit({
          kitId,
          holderType,
          holderId,
          holderName,
          units,
          notes
        });

        checkoutModal.classList.remove("active");
        showToast(`Dispatched ${units} units of kit to ${holderName}!`, "success");
        onRefresh();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  // Return Modal Trigger
  const returnBtns = container.querySelectorAll(".trigger-return-kit-btn");
  const returnModal = container.querySelector("#return-kit-modal");
  returnBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kitId = btn.getAttribute("data-kit-id");
      const kit = getKits().find((k) => k.id === kitId);
      if (!kit || !kit.currentHolders || kit.currentHolders.length === 0) return;

      container.querySelector("#modal-return-kit-id").value = kit.id;
      container.querySelector("#modal-return-kit-name").value = `${kit.sku} - ${kit.name}`;

      const holderSelect = container.querySelector("#modal-return-holder-select");
      holderSelect.innerHTML = kit.currentHolders
        .map(
          (h) => `
        <option value="${h.holderId}" data-units="${h.units}">
          ${h.holderType === "teacher" ? "👨‍🏫" : "🏫"} ${h.holderName} (Holds ${h.units} units)
        </option>
      `
        )
        .join("");

      // Set max return units
      const initialUnits = kit.currentHolders[0]?.units || 1;
      container.querySelector("#modal-return-units").max = initialUnits;
      container.querySelector("#modal-return-units").value = initialUnits;

      holderSelect.addEventListener("change", (ev) => {
        const opt = ev.target.options[ev.target.selectedIndex];
        const maxU = Number(opt.getAttribute("data-units")) || 1;
        container.querySelector("#modal-return-units").max = maxU;
        container.querySelector("#modal-return-units").value = maxU;
      });

      returnModal.classList.add("active");
    });
  });

  // Submit Return Form
  const returnForm = container.querySelector("#return-kit-form");
  if (returnForm) {
    returnForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const kitId = container.querySelector("#modal-return-kit-id").value;
      const holderSelect = container.querySelector("#modal-return-holder-select");
      const holderId = holderSelect.value;
      const units = Number(container.querySelector("#modal-return-units").value);
      const returnCondition = container.querySelector("#modal-return-condition").value;
      const notes = container.querySelector("#modal-return-notes").value;

      try {
        returnKit({
          kitId,
          holderId,
          units,
          returnCondition,
          notes
        });

        returnModal.classList.remove("active");
        showToast(`Successfully returned & restocked ${units} units to Base Lab!`, "success");
        onRefresh();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }
}
