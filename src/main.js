// RoboTrack Pro - Main Application Orchestrator with Multi-Role Authentication & Full CRUD

import "./style.css";
import {
  initializeStorage,
  getSettings,
  saveSettings,
  getStaff,
  getActiveSession,
  resetToDemoData,
  exportPayrollCSV
} from "./utils/storage.js";

import { getAuthUser, setAuthUser, logoutUser } from "./utils/auth.js";
import { renderHeader, bindHeaderEvents } from "./components/Header.js";
import { renderLoginModal, bindLoginModalEvents } from "./components/LoginModal.js";
import { renderSchoolPortalView, bindSchoolPortalEvents } from "./components/SchoolPortalView.js";
import { renderDashboardView, bindDashboardEvents } from "./components/DashboardView.js";
import {
  renderCheckInOutView,
  initCheckInMap,
  bindCheckInOutEvents
} from "./components/CheckInOutView.js";
import {
  renderSessionsCurriculumView,
  bindSessionsCurriculumEvents
} from "./components/SessionsCurriculumView.js";
import { renderFinanceView, bindFinanceEvents } from "./components/FinanceView.js";
import {
  renderSchoolsView,
  initSchoolsMap,
  bindSchoolsEvents
} from "./components/SchoolsView.js";
import { renderStaffView, bindStaffEvents } from "./components/StaffView.js";
import { renderAuditLogView, bindAuditLogEvents } from "./components/AuditLogView.js";
import { renderInventoryView, bindInventoryEvents } from "./components/InventoryView.js";

// Initialize Data Storage
initializeStorage();

const settings = getSettings();
document.documentElement.setAttribute("data-theme", settings.theme || "dark");

// Application State
const authUser = getAuthUser();

const appState = {
  activeTab: authUser.role === "school" ? "school-portal" : "dashboard",
  currentUser: authUser,
  currentUserRole: authUser.role, // 'admin', 'staff', 'school'
  currentUserId: authUser.role === "staff" ? authUser.id : "staff-1",
  selectedSchoolId: authUser.role === "school" ? authUser.schoolId : null,
  userCoords: null,
  hasActiveSession: false,
  theme: settings.theme || "dark",
  showLoginModal: false,
  // Filters
  sessionFilterSchool: "all",
  sessionFilterStaff: "all",
  sessionSearchTerm: "",
  auditFilterStatus: "all",
  auditFilterStaff: "all"
};

// Check if currently selected teacher has an active session
function updateActiveSessionFlag() {
  const staffId = appState.currentUser.role === "staff" ? appState.currentUser.id : "staff-1";
  const active = getActiveSession(staffId);
  appState.hasActiveSession = Boolean(active);
}

// Toast Notifications System
export function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Global App Re-render
function renderApp() {
  updateActiveSessionFlag();

  const isAdmin = appState.currentUser?.role === "admin";
  if (!isAdmin && appState.activeTab === "finance") {
    appState.activeTab = appState.currentUser?.role === "school" ? "school-portal" : "dashboard";
  }

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    ${renderHeader(
      appState,
      handleRoleChange,
      handleTabChange,
      handleSettingsChange
    )}
    <main class="app-main">
      <div id="view-school-portal" class="view-section ${appState.activeTab === "school-portal" ? "active" : ""}">
        ${renderSchoolPortalView(appState)}
      </div>
      <div id="view-dashboard" class="view-section ${appState.activeTab === "dashboard" ? "active" : ""}">
        ${renderDashboardView(appState)}
      </div>
      <div id="view-checkin" class="view-section ${appState.activeTab === "checkin" ? "active" : ""}">
        ${renderCheckInOutView(appState)}
      </div>
      <div id="view-sessions" class="view-section ${appState.activeTab === "sessions" ? "active" : ""}">
        ${renderSessionsCurriculumView(appState)}
      </div>
      ${
        isAdmin
          ? `
      <div id="view-finance" class="view-section ${appState.activeTab === "finance" ? "active" : ""}">
        ${renderFinanceView(appState)}
      </div>
      `
          : ""
      }
      <div id="view-schools" class="view-section ${appState.activeTab === "schools" ? "active" : ""}">
        ${renderSchoolsView(appState)}
      </div>
      <div id="view-inventory" class="view-section ${appState.activeTab === "inventory" ? "active" : ""}">
        ${renderInventoryView(appState)}
      </div>
      <div id="view-staff" class="view-section ${appState.activeTab === "staff" ? "active" : ""}">
        ${renderStaffView(appState)}
      </div>
      <div id="view-audit" class="view-section ${appState.activeTab === "audit" ? "active" : ""}">
        ${renderAuditLogView(appState)}
      </div>
    </main>

    <!-- Authentication & Login Modal -->
    <div id="auth-modal-root">
      ${renderLoginModal(appState)}
    </div>
  `;

  // Bind Header Events
  bindHeaderEvents(
    app,
    appState,
    handleRoleChange,
    handleTabChange,
    handleSettingsChange,
    handleResetDemo,
    () => {
      appState.showLoginModal = true;
      const modal = document.querySelector("#auth-modal");
      if (modal) modal.classList.add("active");
    }
  );

  // Bind Login Modal Events
  bindLoginModalEvents(app, appState, handleLoginSuccess, showToast);

  // Bind Active Tab Events & Initialize Maps
  if (appState.activeTab === "school-portal") {
    const portalEl = document.getElementById("view-school-portal");
    bindSchoolPortalEvents(portalEl, appState, renderApp, showToast);
  } else if (appState.activeTab === "dashboard") {
    const dashEl = document.getElementById("view-dashboard");
    bindDashboardEvents(
      dashEl,
      appState,
      handleTabChange,
      (schoolId) => {
        appState.selectedSchoolId = schoolId;
        handleTabChange("checkin");
      },
      () => {
        handleTabChange("checkin");
        setTimeout(() => {
          const btn = document.querySelector("#open-checkout-modal-btn");
          if (btn) btn.click();
        }, 150);
      },
      () => {
        exportPayrollCSV();
        showToast("Payroll summary CSV downloaded!", "success");
      }
    );
  } else if (appState.activeTab === "checkin") {
    const checkinEl = document.getElementById("view-checkin");
    bindCheckInOutEvents(checkinEl, appState, renderApp, showToast);
    initCheckInMap(checkinEl, appState, (newCoords) => {
      appState.userCoords = newCoords;
      renderApp();
    });
  } else if (appState.activeTab === "sessions") {
    const sessEl = document.getElementById("view-sessions");
    bindSessionsCurriculumEvents(sessEl, appState, renderApp, showToast);
  } else if (appState.activeTab === "finance" && isAdmin) {
    const finEl = document.getElementById("view-finance");
    if (finEl) bindFinanceEvents(finEl, appState, renderApp, showToast);
  } else if (appState.activeTab === "schools") {
    const schEl = document.getElementById("view-schools");
    bindSchoolsEvents(
      schEl,
      appState,
      (schoolId) => {
        appState.selectedSchoolId = schoolId;
        handleTabChange("checkin");
      },
      renderApp,
      showToast
    );
    initSchoolsMap(schEl, appState);
  } else if (appState.activeTab === "inventory") {
    const invEl = document.getElementById("view-inventory");
    bindInventoryEvents(invEl, appState, renderApp, showToast);
  } else if (appState.activeTab === "staff") {
    const staffEl = document.getElementById("view-staff");
    bindStaffEvents(staffEl, appState, renderApp, showToast);
  } else if (appState.activeTab === "audit") {
    const auditEl = document.getElementById("view-audit");
    bindAuditLogEvents(auditEl, appState, renderApp);
  }
}

// Handlers
function handleLoginSuccess(user) {
  appState.currentUser = user;
  appState.currentUserRole = user.role;

  if (user.role === "school") {
    appState.selectedSchoolId = user.schoolId;
    appState.activeTab = "school-portal";
  } else if (user.role === "staff") {
    appState.currentUserId = user.id;
    appState.activeTab = "checkin";
  } else {
    appState.activeTab = "dashboard";
  }

  renderApp();
}

function handleRoleChange(selectedRole) {
  if (selectedRole === "admin") {
    appState.currentUserRole = "admin";
  } else {
    appState.currentUserRole = "teacher";
    appState.currentUserId = selectedRole;
  }
  const staff = getStaff().find((s) => s.id === appState.currentUserId);
  showToast(`Switched view to: ${selectedRole === "admin" ? "Director / Admin" : staff?.name || selectedRole}`, "info");
  renderApp();
}

function handleTabChange(tabName) {
  if (tabName === "finance" && appState.currentUser?.role !== "admin") {
    showToast("Access restricted: Only administrators can view financial records.", "warning");
    return;
  }
  appState.activeTab = tabName;
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleSettingsChange() {
  const currentSettings = getSettings();
  appState.theme = currentSettings.theme;
  renderApp();
}

function handleResetDemo() {
  resetToDemoData();
  appState.selectedSchoolId = null;
  appState.userCoords = null;
  showToast("Demo data restored to default state!", "success");
  renderApp();
}

// Initial Launch
renderApp();
