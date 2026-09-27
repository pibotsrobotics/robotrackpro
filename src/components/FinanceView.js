// Comprehensive Financial Management: Salary, Advances, Travel & Payslips

import {
  getStaff,
  getSchools,
  getAdvances,
  getTravelExpenses,
  getSalaryPayments,
  calculateStaffFinancials,
  addAdvancePayment,
  addTravelExpense,
  updateTravelStatus,
  updateTravelExpense,
  deleteAdvancePayment,
  deleteTravelExpense,
  recordSalaryDisbursement,
  formatCurrency,
  exportPayrollCSV
} from "../utils/storage.js";

import {
  formatPayslipWhatsAppText,
  openWhatsApp,
  copyTextWithFeedback
} from "../utils/whatsapp.js";

let activePayslipData = null;

export function renderFinanceView(state) {
  const staffList = getStaff();
  const schools = getSchools();
  const advances = getAdvances();
  const travelList = getTravelExpenses();
  const payments = getSalaryPayments();

  return `
    <div class="view-header">
      <div class="view-title">
        <h2>💰 Financial & Payroll Control</h2>
        <p>Flexible per-day & per-hour salary calculations, advance payment deductions, travel allowances & net pending dues</p>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button id="open-record-advance-btn" class="btn btn-warning">
          💳 Record Advance Payment
        </button>
        <button id="open-log-travel-btn" class="btn btn-primary">
          🚗 Claim Travel Expense
        </button>
        <button id="finance-export-payroll-btn" class="btn btn-secondary">
          📑 Export Payroll CSV
        </button>
      </div>
    </div>

    <!-- Teacher Salary Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      ${staffList
        .map((staff) => {
          const fin = calculateStaffFinancials(staff.id);
          return `
          <div class="panel-card" style="border-top: 3px solid var(--cyan-primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 2.2rem;">${staff.avatar}</span>
                <div>
                  <h3 style="font-size: 1.25rem;">${staff.name}</h3>
                  <div style="font-size: 0.8rem; color: var(--text-secondary);">${staff.role}</div>
                </div>
              </div>
              <div style="text-align: right;">
                <span class="status-badge ${fin.wageType === 'monthly' ? 'badge-verified' : fin.wageType === 'daily' ? 'badge-warning' : 'badge-info'}">
                  ${fin.rateFormatted}
                </span>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">
                  ${fin.wageType === 'monthly' ? '📅 Monthly Salary Model' : fin.wageType === 'daily' ? '📆 Daily Wage Model' : '⏱️ Hourly Wage Model'} • ${staff.assignedSchools.length} Schools
                </div>
              </div>
            </div>

            <!-- Financial Calculation Ledger for this Teacher -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.35rem 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                <span style="color: var(--text-secondary);">Verified Work Output:</span>
                <strong>${fin.totalSessions} sessions (${fin.unitsFormatted})</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.35rem 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                <span style="color: var(--text-secondary);">Gross Earned Pay (${fin.wageType === 'monthly' ? `Monthly Fixed Base: ${formatCurrency(fin.monthlySalary || 35000)}` : fin.wageType === 'daily' ? `${fin.workingDays} active days × ${formatCurrency(fin.dailyRate)}` : `${fin.totalHours}h × ${formatCurrency(fin.hourlyRate)}`}):</span>
                <strong>${formatCurrency(fin.earnedSalary)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.35rem 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                <span style="color: var(--text-secondary);">Approved Travel Allowances:</span>
                <strong style="color: var(--cyan-primary);">+ ${formatCurrency(fin.totalTravelAllowance)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.35rem 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                <span style="color: var(--text-secondary);">Total Advances Paid to Date:</span>
                <strong style="color: var(--amber-primary);">- ${formatCurrency(fin.totalAdvancesPaid)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.35rem 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                <span style="color: var(--text-secondary);">Salary Already Settled:</span>
                <strong style="color: var(--text-muted);">- ${formatCurrency(fin.totalSalaryAlreadyPaid)}</strong>
              </div>

              <!-- Net Pending Salary Callout -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid var(--border-highlight);">
                <div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--cyan-primary); letter-spacing: 0.05em;">
                    NET PENDING SALARY DUE
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">(After advance deduction)</div>
                </div>
                <div style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: #00F0FF;">
                  ${formatCurrency(fin.netPendingSalary)}
                </div>
              </div>
            </div>

            <!-- Action Buttons for this Teacher -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.45rem;">
              <button class="btn btn-success btn-sm trigger-settle-salary-btn" data-staff="${staff.id}">
                💸 Settle
              </button>
              <button class="btn btn-outline-cyan btn-sm trigger-view-payslip-btn" data-staff="${staff.id}">
                📄 Pay Slip
              </button>
              <button class="btn btn-secondary btn-sm trigger-wa-payslip-btn" data-staff="${staff.id}" title="Send salary voucher via WhatsApp">
                📱 WhatsApp
              </button>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>

    <!-- Section: Advance Payments Ledger -->
    <div class="table-card">
      <div class="table-header-toolbar">
        <div>
          <h3>💳 Advance Payments Ledger</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Payments disbursed in advance to teachers (auto-deductible during settlement)</p>
        </div>
        <button id="inline-add-advance-btn" class="btn btn-warning btn-sm">
          ➕ New Advance Payout
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Teacher</th>
              <th>Advance Amount</th>
              <th>Payment Mode</th>
              <th>Reference No</th>
              <th>Purpose / Reason</th>
              <th>Recorded By</th>
              <th>Status</th>
              <th style="text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${
              advances.length === 0
                ? `<tr><td colspan="9" style="text-align:center; padding: 2rem; color: var(--text-muted);">No advance payments recorded yet.</td></tr>`
                : advances
                    .map(
                      (adv) => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 600;">${adv.date}</td>
                <td><strong>${adv.staffName}</strong></td>
                <td>
                  <strong style="color: var(--amber-primary); font-size: 1rem;">${formatCurrency(adv.amount)}</strong>
                </td>
                <td>${adv.paymentMode}</td>
                <td><code style="font-size: 0.76rem;">${adv.referenceNo}</code></td>
                <td>${adv.reason} ${adv.notes ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${adv.notes}</div>` : ""}</td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${adv.recordedBy}</td>
                <td><span class="status-badge badge-verified">✅ Disbursed</span></td>
                <td style="text-align: center;">
                  <button class="btn btn-danger btn-sm delete-advance-btn" data-id="${adv.id}" title="Delete advance payout">
                    🗑️
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

    <!-- Section: Travel Expenses Ledger -->
    <div class="table-card">
      <div class="table-header-toolbar">
        <div>
          <h3>🚗 Travel & Equipment Transport Claims</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Request-based reimbursements only (flat rates prohibited). Subject to Director review & approval.</p>
        </div>
        <button id="inline-add-travel-btn" class="btn btn-primary btn-sm">
          ➕ New Travel Claim
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Teacher</th>
              <th>School Visited</th>
              <th>Mode & Distance</th>
              <th>Requested Amount</th>
              <th>Claim Purpose / Justification</th>
              <th>Status</th>
              <th>Director Action</th>
            </tr>
          </thead>
          <tbody>
            ${
              travelList.length === 0
                ? `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No travel claims submitted yet.</td></tr>`
                : travelList
                    .map(
                      (trv) => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 600;">${trv.date}</td>
                <td><strong>${trv.staffName}</strong></td>
                <td>${trv.schoolName}</td>
                <td>
                  <div>${trv.mode}</div>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">${trv.distanceKm ? `${trv.distanceKm} km` : "Custom"}</div>
                </td>
                <td>
                  <strong style="color: var(--cyan-primary); font-size: 1rem;">${formatCurrency(trv.amount)}</strong>
                </td>
                <td style="font-size: 0.8rem; max-width: 220px; line-height: 1.4;">
                  <div style="color: var(--text-primary); font-weight: 500;">${trv.notes || trv.claimType || "Travel reimbursement"}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${trv.receiptNo || ""}</div>
                </td>
                <td>
                  <span class="status-badge ${trv.status === "Approved" ? "badge-verified" : trv.status === "Pending" ? "badge-warning" : "badge-rejected"}">
                    ${trv.status === "Pending" ? "⏳ Pending Review" : trv.status}
                  </span>
                </td>
                <td>
                  <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
                    ${
                      trv.status === "Pending"
                        ? `
                      <button class="btn btn-success btn-xs travel-status-action-btn" data-id="${trv.id}" data-action="Approved" title="Approve exact requested amount">✅ Approve</button>
                      <button class="btn btn-outline-cyan btn-xs travel-adjust-btn" data-id="${trv.id}" data-amount="${trv.amount}" title="Adjust approved amount">✏️ Adjust</button>
                      <button class="btn btn-warning btn-xs travel-status-action-btn" data-id="${trv.id}" data-action="Rejected" title="Reject request">❌ Reject</button>
                    `
                        : `<span style="font-size: 0.78rem; color: var(--text-muted);">Processed</span>`
                    }
                    <button class="btn btn-danger btn-xs delete-travel-btn" data-id="${trv.id}" title="Delete travel claim">
                      🗑️
                    </button>
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

    <!-- Section: Past Salary Settlements -->
    <div class="table-card">
      <div class="table-header-toolbar">
        <div>
          <h3>📑 Salary Settlement & Disbursement History</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Historical monthly salary payout receipts</p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Payout Date</th>
              <th>Pay Cycle</th>
              <th>Teacher</th>
              <th>Units Paid (Days / Hrs)</th>
              <th>Teaching Pay</th>
              <th>Travel Added</th>
              <th>Advance Deducted</th>
              <th>Net Amount Paid</th>
              <th>Reference No</th>
              <th>Payslip</th>
            </tr>
          </thead>
          <tbody>
            ${
              payments.length === 0
                ? `<tr><td colspan="10" style="text-align:center; padding: 2rem; color: var(--text-muted);">No salary disbursements processed yet.</td></tr>`
                : payments
                    .map(
                      (p) => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 600;">${p.date}</td>
                <td><span class="status-badge badge-info">${p.period}</span></td>
                <td><strong>${p.staffName}</strong></td>
                <td><span class="status-badge ${p.wageType === 'monthly' ? 'badge-verified' : p.wageType === 'daily' ? 'badge-warning' : 'badge-info'}" style="font-size: 0.76rem;">${p.wageType === 'monthly' ? '1 Month' : p.wageType === 'daily' ? `${p.workingDays || p.unitCount || '--'} days` : `${p.totalHours || p.unitCount || '--'} hrs`}</span></td>
                <td>${formatCurrency(p.earnedSalary)}</td>
                <td style="color: var(--cyan-primary);">+ ${formatCurrency(p.travelAllowance)}</td>
                <td style="color: var(--amber-primary);">- ${formatCurrency(p.advanceDeducted)}</td>
                <td>
                  <strong style="color: var(--emerald-primary); font-size: 1.05rem;">${formatCurrency(p.netPaid)}</strong>
                </td>
                <td><code style="font-size: 0.76rem;">${p.referenceNo}</code></td>
                <td>
                  <button class="btn btn-secondary btn-sm print-past-slip-btn" data-id="${p.id}">
                    🖨️ Payslip
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

    <!-- MODAL 1: Record Advance Payment -->
    <div id="advance-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>💳 Record Advance Payment to Staff</h3>
          <button class="btn-icon close-advance-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="advance-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Teacher *</label>
                <select id="adv-staff-select" class="form-control form-select" required>
                  ${staffList.map((st) => `<option value="${st.id}">${st.name}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Advance Amount (₹ / $) *</label>
                <input type="number" id="adv-amount" class="form-control" placeholder="e.g. 5000" min="100" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Payment Date *</label>
                <input type="date" id="adv-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Mode *</label>
                <select id="adv-mode" class="form-control form-select">
                  <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Transaction Reference / UTR Number</label>
              <input type="text" id="adv-ref" class="form-control" placeholder="e.g. UPI-20260927-9921">
            </div>

            <div class="form-group">
              <label class="form-label">Reason / Advance Purpose *</label>
              <input type="text" id="adv-reason" class="form-control" placeholder="e.g. Robotics parts purchase advance / Mid-month advance" required>
            </div>

            <div class="form-group">
              <label class="form-label">Additional Notes</label>
              <textarea id="adv-notes" class="form-control" rows="2" placeholder="Auto-deductible during month-end payroll settlement."></textarea>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-advance-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-warning">Disburse & Save Advance</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Claim Travel Expense -->
    <div id="travel-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>🚗 Submit Travel / Kit Transport Claim</h3>
          <button class="btn-icon close-travel-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <form id="travel-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Teacher *</label>
                <select id="trv-staff-select" class="form-control form-select" required>
                  ${staffList.map((st) => `<option value="${st.id}">${st.name}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">School Visited *</label>
                <select id="trv-school-select" class="form-control form-select" required>
                  ${schools.map((sch) => `<option value="${sch.id}">${sch.name}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date of Travel *</label>
                <input type="date" id="trv-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Mode of Travel</label>
                <select id="trv-mode" class="form-control form-select">
                  <option value="Two-Wheeler">🛵 Two-Wheeler (Standard)</option>
                  <option value="Cab / Auto (Carrying Kits)">🚕 Cab / Auto (Carrying heavy robotics kits)</option>
                  <option value="Public Transit">🚆 Metro / Bus</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Distance (km)</label>
                <input type="number" id="trv-distance" class="form-control" value="18" min="1">
              </div>

              <div class="form-group">
                <label class="form-label">Claim Amount (₹ / $) *</label>
                <input type="number" id="trv-amount" class="form-control" value="270" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes / Justification</label>
              <input type="text" id="trv-notes" class="form-control" placeholder="e.g. Carried 10x robot car chassis and battery packs">
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary close-travel-modal-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Travel Claim</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Settle / Disburse Salary Payment -->
    <div id="settle-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>💸 Disburse / Settle Teacher Salary</h3>
          <button class="btn-icon close-settle-modal-btn">✕</button>
        </div>
        <div class="modal-body" id="settle-modal-body">
          <!-- Dynamically populated on open -->
        </div>
      </div>
    </div>

    <!-- MODAL 4: Official Pay Slip & Printable Voucher -->
    <div id="payslip-modal" class="modal-overlay">
      <div class="modal-dialog" style="max-width: 760px; background: transparent; border: none; box-shadow: none;">
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
          <button id="whatsapp-payslip-action-btn" class="btn btn-outline-cyan">
            📱 Share to WhatsApp
          </button>
          <button id="print-payslip-action-btn" class="btn btn-primary">
            🖨️ Print / Save as PDF
          </button>
          <button class="btn btn-secondary close-payslip-modal-btn">
            ✕ Close
          </button>
        </div>
        <div class="payslip-voucher" id="printable-payslip-content">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>
  `;
}

export function bindFinanceEvents(container, state, onRefresh, showToast) {
  const staffList = getStaff();
  const schools = getSchools();

  // Export CSV
  const exportBtn = container.querySelector("#finance-export-payroll-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportPayrollCSV();
      showToast("Payroll summary exported to CSV!", "success");
    });
  }

  // Record Advance Modal triggers
  const advanceModal = container.querySelector("#advance-modal");
  const openAdvBtn = container.querySelector("#open-record-advance-btn");
  const inlineAdvBtn = container.querySelector("#inline-add-advance-btn");
  const closeAdvBtns = container.querySelectorAll(".close-advance-modal-btn");

  if (openAdvBtn && advanceModal) openAdvBtn.addEventListener("click", () => advanceModal.classList.add("active"));
  if (inlineAdvBtn && advanceModal) inlineAdvBtn.addEventListener("click", () => advanceModal.classList.add("active"));
  closeAdvBtns.forEach((btn) => btn.addEventListener("click", () => advanceModal.classList.remove("active")));

  // Submit Advance
  const advanceForm = container.querySelector("#advance-form");
  if (advanceForm) {
    advanceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const staffId = container.querySelector("#adv-staff-select").value;
      const amount = container.querySelector("#adv-amount").value;
      const date = container.querySelector("#adv-date").value;
      const mode = container.querySelector("#adv-mode").value;
      const ref = container.querySelector("#adv-ref").value;
      const reason = container.querySelector("#adv-reason").value;
      const notes = container.querySelector("#adv-notes").value;

      addAdvancePayment({
        staffId,
        amount,
        date,
        paymentMode: mode,
        referenceNo: ref,
        reason,
        notes
      });

      advanceModal.classList.remove("active");
      showToast(`Advance payment of ${formatCurrency(amount)} recorded!`, "success");
      onRefresh();
    });
  }

  // Travel Modal triggers
  const travelModal = container.querySelector("#travel-modal");
  const openTrvBtn = container.querySelector("#open-log-travel-btn");
  const inlineTrvBtn = container.querySelector("#inline-add-travel-btn");
  const closeTrvBtns = container.querySelectorAll(".close-travel-modal-btn");

  if (openTrvBtn && travelModal) openTrvBtn.addEventListener("click", () => travelModal.classList.add("active"));
  if (inlineTrvBtn && travelModal) inlineTrvBtn.addEventListener("click", () => travelModal.classList.add("active"));
  closeTrvBtns.forEach((btn) => btn.addEventListener("click", () => travelModal.classList.remove("active")));

  // Auto suggest travel amount (flexible, not fixed)
  const trvDist = container.querySelector("#trv-distance");
  const trvAmount = container.querySelector("#trv-amount");
  if (trvDist && trvAmount) {
    trvDist.addEventListener("input", (e) => {
      const km = Number(e.target.value) || 0;
      if (!trvAmount.value || trvAmount.value === "0") {
        trvAmount.value = km * 15;
      }
    });
  }

  // Submit Travel Claim
  const travelForm = container.querySelector("#travel-form");
  if (travelForm) {
    travelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const staffId = container.querySelector("#trv-staff-select").value;
      const schoolId = container.querySelector("#trv-school-select").value;
      const date = container.querySelector("#trv-date").value;
      const mode = container.querySelector("#trv-mode").value;
      const distanceKm = container.querySelector("#trv-distance").value;
      const amount = container.querySelector("#trv-amount").value;
      const notes = container.querySelector("#trv-notes").value;

      addTravelExpense({
        staffId,
        schoolId,
        date,
        mode,
        distanceKm,
        amount,
        notes,
        status: "Approved"
      });

      travelModal.classList.remove("active");
      showToast(`Travel claim of ${formatCurrency(amount)} recorded & approved!`, "success");
      onRefresh();
    });
  }

  // Approve / Reject travel actions
  const travelActionBtns = container.querySelectorAll(".travel-status-action-btn");
  travelActionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      updateTravelStatus(id, action);
      showToast(`Travel claim marked as ${action}!`, "info");
      onRefresh();
    });
  });

  // Adjust & Approve travel allowance action
  const travelAdjustBtns = container.querySelectorAll(".travel-adjust-btn");
  travelAdjustBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const currentAmt = btn.getAttribute("data-amount");
      const newAmt = prompt(`Enter adjusted allowance amount to approve for this travel claim:`, currentAmt);
      if (newAmt !== null && !isNaN(Number(newAmt)) && Number(newAmt) >= 0) {
        updateTravelExpense(id, { amount: Number(newAmt), status: "Approved" });
        showToast(`Travel claim updated to ${formatCurrency(newAmt)} and Approved!`, "success");
        onRefresh();
      }
    });
  });

  // Delete Advance payment
  const deleteAdvBtns = container.querySelectorAll(".delete-advance-btn");
  deleteAdvBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this advance payment record?")) {
        deleteAdvancePayment(id);
        showToast("Advance payment record deleted.", "info");
        onRefresh();
      }
    });
  });

  // Delete Travel claim
  const deleteTrvBtns = container.querySelectorAll(".delete-travel-btn");
  deleteTrvBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this travel claim?")) {
        deleteTravelExpense(id);
        showToast("Travel expense claim deleted.", "info");
        onRefresh();
      }
    });
  });

  // Settle Salary Modal
  const settleModal = container.querySelector("#settle-modal");
  const settleModalBody = container.querySelector("#settle-modal-body");
  const closeSettleBtns = container.querySelectorAll(".close-settle-modal-btn");
  closeSettleBtns.forEach((btn) => btn.addEventListener("click", () => settleModal.classList.remove("active")));

  const settleBtns = container.querySelectorAll(".trigger-settle-salary-btn");
  settleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const staffId = btn.getAttribute("data-staff");
      const fin = calculateStaffFinancials(staffId);
      const staff = staffList.find((s) => s.id === staffId);
      if (!fin || !staff) return;

      settleModalBody.innerHTML = `
        <form id="execute-settle-form">
          <div style="background: rgba(0,0,0,0.25); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem;">
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">${staff.name}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              • Wage Calculation Model: <strong style="color: var(--cyan-primary);">${fin.wageType === 'monthly' ? `📅 Per Month (${formatCurrency(fin.monthlySalary || 35000)}/mo)` : fin.wageType === 'daily' ? `📆 Per Day (${formatCurrency(fin.dailyRate)}/day)` : `⏱️ Per Hour (${formatCurrency(fin.hourlyRate)}/hr)`}</strong><br>
              • Verified Unpaid Units: <strong>${fin.unitsFormatted}</strong> (${formatCurrency(fin.unpaidEarnedSalary)})<br>
              • Unpaid Travel Reimbursements: <strong>${formatCurrency(fin.unpaidTravelAllowance)}</strong><br>
              • Active Advance Paid Balance: <strong style="color: var(--amber-primary);">${formatCurrency(fin.unadjustedAdvance)}</strong>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Payment Period / Cycle</label>
              <input type="text" id="settle-period" class="form-control" value="September 2026 Settlement" required>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Date</label>
              <input type="date" id="settle-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Advance to Deduct (${formatCurrency(fin.unadjustedAdvance)} available)</label>
              <input type="number" id="settle-deduct-adv" class="form-control" value="${Math.min(fin.unadjustedAdvance, fin.grossPending)}" max="${fin.unadjustedAdvance}">
            </div>

            <div class="form-group">
              <label class="form-label">Net Disbursed Amount (${formatCurrency(fin.netPendingSalary)})</label>
              <input type="number" id="settle-net-amount" class="form-control" value="${fin.netPendingSalary}" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Payment Mode</label>
              <select id="settle-mode" class="form-control form-select">
                <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                <option value="UPI Direct">UPI Direct</option>
                <option value="Cash Voucher">Cash Voucher</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Transaction Reference #</label>
              <input type="text" id="settle-ref" class="form-control" value="SAL-${Date.now().toString().slice(-6)}" required>
            </div>
          </div>

          <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1.25rem;">
            <button type="button" class="btn btn-secondary close-settle-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-success">✅ Confirm Payout & Record Voucher</button>
          </div>
        </form>
      `;

      // bind form
      const form = settleModalBody.querySelector("#execute-settle-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const period = settleModalBody.querySelector("#settle-period").value;
        const deductAdv = settleModalBody.querySelector("#settle-deduct-adv").value;
        const netAmt = settleModalBody.querySelector("#settle-net-amount").value;
        const mode = settleModalBody.querySelector("#settle-mode").value;
        const ref = settleModalBody.querySelector("#settle-ref").value;

        recordSalaryDisbursement({
          staffId: staff.id,
          period,
          paymentMode: mode,
          referenceNo: ref,
          deductAdvanceAmount: deductAdv,
          customPayAmount: netAmt,
          notes: "Salary cycle settled with advance adjustments"
        });

        settleModal.classList.remove("active");
        showToast(`Salary disbursed: ${formatCurrency(netAmt)} paid to ${staff.name}!`, "success");
        onRefresh();
      });

      settleModal.classList.add("active");
    });
  });

  // Payslip Modal
  const payslipModal = container.querySelector("#payslip-modal");
  const payslipContent = container.querySelector("#printable-payslip-content");
  const closePayslipBtns = container.querySelectorAll(".close-payslip-modal-btn");
  closePayslipBtns.forEach((btn) => btn.addEventListener("click", () => payslipModal.classList.remove("active")));

  const printBtn = container.querySelector("#print-payslip-action-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Share Payslip via WhatsApp from Modal
  const waPayslipModalBtn = container.querySelector("#whatsapp-payslip-action-btn");
  if (waPayslipModalBtn) {
    waPayslipModalBtn.addEventListener("click", () => {
      if (activePayslipData) {
        const text = formatPayslipWhatsAppText(activePayslipData.staff, activePayslipData.fin);
        openWhatsApp(text, activePayslipData.staff.phone);
        showToast("Opening WhatsApp with salary voucher...", "info");
      }
    });
  }

  // Direct WhatsApp Button from Teacher Card
  const waTeacherCardBtns = container.querySelectorAll(".trigger-wa-payslip-btn");
  waTeacherCardBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const staffId = btn.getAttribute("data-staff");
      const fin = calculateStaffFinancials(staffId);
      const staff = staffList.find((s) => s.id === staffId);
      if (fin && staff) {
        const text = formatPayslipWhatsAppText(staff, fin);
        openWhatsApp(text, staff.phone);
        showToast(`Sharing salary voucher for ${staff.name} to WhatsApp...`, "info");
      }
    });
  });

  // View Payslip for staff
  const payslipBtns = container.querySelectorAll(".trigger-view-payslip-btn");
  payslipBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const staffId = btn.getAttribute("data-staff");
      const fin = calculateStaffFinancials(staffId);
      const staff = staffList.find((s) => s.id === staffId);
      if (!fin || !staff) return;

      activePayslipData = { staff, fin };
      renderPayslipDocument(payslipContent, staff, fin);
      payslipModal.classList.add("active");
    });
  });

  // Print past slip button
  const pastSlipBtns = container.querySelectorAll(".print-past-slip-btn");
  pastSlipBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const payId = btn.getAttribute("data-id");
      const payment = getSalaryPayments().find((p) => p.id === payId);
      if (!payment) return;
      const staff = staffList.find((s) => s.id === payment.staffId) || { name: payment.staffName, role: "Robotics Lead", hourlyRate: payment.hourlyRate, phone: "" };
      
      const fin = {
        wageType: payment.wageType || (payment.staffId === "staff-2" ? "monthly" : "hourly"),
        rate: payment.rate || (payment.wageType === "monthly" ? (payment.monthlySalary || 35000) : (payment.wageType === "daily" ? (payment.dailyRate || 2200) : (payment.hourlyRate || 750))),
        rateFormatted: payment.wageType === "monthly" ? `${formatCurrency(payment.monthlySalary || 35000)} / month` : (payment.wageType === "daily" ? `${formatCurrency(payment.dailyRate || 2200)} / day` : `${formatCurrency(payment.hourlyRate || 750)} / hr`),
        workingDays: payment.workingDays || payment.unitCount,
        totalHours: payment.totalHours,
        earnedSalary: payment.earnedSalary,
        totalTravelAllowance: payment.travelAllowance,
        unadjustedAdvance: payment.advanceDeducted,
        netPendingSalary: payment.netPaid,
        voucherRef: payment.referenceNo,
        voucherDate: payment.date,
        voucherPeriod: payment.period
      };

      activePayslipData = { staff, fin };
      renderPayslipDocument(payslipContent, staff, fin);
      payslipModal.classList.add("active");
    });
  });
}

function renderPayslipDocument(container, staff, fin) {
  container.innerHTML = `
    <div class="payslip-header">
      <div class="payslip-brand">
        <h2>ROBOTRACK ACADEMY</h2>
        <div style="font-size: 0.85rem; color: #64748B;">STEM & Robotics Education Excellence</div>
        <div style="font-size: 0.78rem; color: #94A3B8;">Multi-School Training Operations • ISO 9001:2015</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 1.1rem; font-weight: 700; color: #0F172A;">SALARY STATEMENT & PAY SLIP</div>
        <div style="font-size: 0.82rem; color: #64748B;">Voucher #: <strong>${fin.voucherRef || `VCH-${Date.now().toString().slice(-6)}`}</strong></div>
        <div style="font-size: 0.82rem; color: #64748B;">Date: <strong>${fin.voucherDate || new Date().toISOString().split("T")[0]}</strong></div>
      </div>
    </div>

    <!-- Teacher Info Card -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #F8FAFC; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.88rem;">
      <div>
        <div style="color: #64748B; font-size: 0.76rem; text-transform: uppercase;">TEACHER / TRAINER</div>
        <div style="font-weight: 700; font-size: 1.05rem; color: #0F172A;">${staff.name}</div>
        <div style="color: #64748B;">Designation: ${staff.role}</div>
      </div>
      <div>
        <div style="color: #64748B; font-size: 0.76rem; text-transform: uppercase;">REMUNERATION STRUCTURE</div>
        <div style="color: #0F172A;">Wage Model: <strong>${fin.wageType === 'monthly' ? 'Per-Month Contract (Fixed Monthly Salary)' : fin.wageType === 'daily' ? 'Per-Day Contract (Daily Rate)' : 'Per-Hour Contract (Hourly Rate)'}</strong></div>
        <div style="color: #0F172A;">Agreed Rate: <strong>${fin.rateFormatted}</strong></div>
        <div style="color: #0F172A;">Period: <strong>${fin.voucherPeriod || "Current Active Cycle"}</strong></div>
      </div>
    </div>

    <!-- Itemized Breakdown Table -->
    <table class="payslip-table">
      <thead>
        <tr>
          <th>Earnings Description</th>
          <th style="text-align: center;">Hours / Units</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Robotics Teaching & Hands-on Lab Sessions</strong><br>
            <span style="font-size: 0.78rem; color: #64748B;">${fin.wageType === 'monthly' ? `Fixed Monthly Teaching Retainer (${fin.workingDays} active days, ${fin.totalHours} hrs conducted)` : fin.wageType === 'daily' ? `Flat Daily Rate per School Teaching Day (${fin.workingDays} active days conducted)` : `Hourly Rate per Verified Teaching Session (${fin.totalHours} logged hours conducted)`}</span>
          </td>
          <td style="text-align: center;">${fin.wageType === 'monthly' ? '1 Month' : fin.wageType === 'daily' ? `${fin.workingDays} days` : `${fin.totalHours} hrs`}</td>
          <td style="text-align: right;">${formatCurrency(fin.rate)}</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(fin.earnedSalary)}</td>
        </tr>
        <tr>
          <td>
            <strong>Travel & Hardware Transport Reimbursements</strong><br>
            <span style="font-size: 0.78rem; color: #64748B;">Approved school visit allowances and kit carriage</span>
          </td>
          <td style="text-align: center;">--</td>
          <td style="text-align: right;">--</td>
          <td style="text-align: right; font-weight: 600; color: #0284C7;">+ ${formatCurrency(fin.totalTravelAllowance)}</td>
        </tr>
        <tr>
          <td>
            <strong>Advance Salary Deduction</strong><br>
            <span style="font-size: 0.78rem; color: #64748B;">Adjusted against previous advance payments disbursed</span>
          </td>
          <td style="text-align: center;">--</td>
          <td style="text-align: right;">--</td>
          <td style="text-align: right; font-weight: 600; color: #D97706;">- ${formatCurrency(fin.unadjustedAdvance)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Net Total Box -->
    <div class="payslip-total-box">
      <div>
        <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #475569;">NET SALARY PAYABLE / DISBURSED</div>
        <div style="font-size: 0.78rem; color: #64748B;">Direct Bank Settlement / Cash Voucher</div>
      </div>
      <div class="payslip-total-amount">
        ${formatCurrency(fin.netPendingSalary)}
      </div>
    </div>

    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; margin-top: 3.5rem; padding-top: 1rem; border-top: 1px dashed #CBD5E1; font-size: 0.82rem; color: #64748B;">
      <div style="text-align: center;">
        <div style="width: 160px; border-bottom: 1px solid #94A3B8; margin-bottom: 0.35rem;"></div>
        Teacher Signature (${staff.name})
      </div>
      <div style="text-align: center;">
        <div style="width: 160px; border-bottom: 1px solid #94A3B8; margin-bottom: 0.35rem;"></div>
        Authorized Signatory (Robotics Director)
      </div>
    </div>
  `;
}
