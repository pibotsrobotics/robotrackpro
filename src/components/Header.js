// Header and Navigation Component with Multi-Role Authentication Bar

import { getStaff, getSchools, getSettings, saveSettings, getMapConfig, saveMapConfig } from "../utils/storage.js";

export function renderHeader(state, onRoleChange, onTabChange, onSettingsChange) {
  const settings = getSettings();
  const mapConfig = getMapConfig();
  const user = state.currentUser || {
    role: "admin",
    name: "Dr. Vikram Sarabhai",
    avatar: "👑",
    title: "Director"
  };

  const isSchool = user.role === "school";
  const isStaff = user.role === "staff";
  const isAdmin = user.role === "admin";

  const headerHtml = `
    <header class="app-header">
      <div class="header-top">
        <div class="brand-section">
          <img src="/logo.jpg" alt="RoboTrack Pro Logo" class="brand-logo-img" />
          <div class="brand-text">
            <h1>RoboTrack <span>PRO</span></h1>
            <div class="tagline">STEM & Robotics Multi-School Academy Suite</div>
          </div>
        </div>

        <div class="header-controls">
          <!-- Active Authenticated User Pill -->
          <div class="auth-user-pill" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-highlight); padding: 0.35rem 0.75rem; border-radius: var(--radius-full);">
            <span style="font-size: 1.25rem;">${user.avatar || (isSchool ? "🏫" : isStaff ? "👨‍🏫" : "👑")}</span>
            <div style="line-height: 1.2;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">${user.name}</div>
              <div style="font-size: 0.68rem; color: var(--cyan-primary); text-transform: uppercase; letter-spacing: 0.05em;">
                ${isSchool ? "🏫 Partner School Portal" : isStaff ? "👨‍🏫 Teaching Faculty" : "👑 Academy Director / Admin"}
              </div>
            </div>
          </div>

          <!-- Switch User / Login Button -->
          <button id="open-auth-modal-btn" class="btn btn-primary btn-sm" title="Log in as Admin, Staff, or School Portal">
            🔑 Switch / Login
          </button>

          <!-- Currency Switcher -->
          <div class="role-switcher-container">
            <span class="role-switcher-label">Currency:</span>
            <select id="currency-selector" class="role-select" style="padding: 0.15rem 0.35rem;">
              <option value="₹" ${settings.currency === "₹" ? "selected" : ""}>₹ INR</option>
              <option value="$" ${settings.currency === "$" ? "selected" : ""}>$ USD</option>
              <option value="€" ${settings.currency === "€" ? "selected" : ""}>€ EUR</option>
              <option value="£" ${settings.currency === "£" ? "selected" : ""}>£ GBP</option>
            </select>
          </div>

          <!-- Map & API Key Settings -->
          <button id="open-map-config-modal-btn" class="btn btn-secondary btn-sm" title="Configure Map Provider & API Key">
            🗺️ Map & API
          </button>

          <!-- Theme Toggle -->
          <button id="theme-toggle-btn" class="btn-icon" title="Toggle Dark/Light Mode">
            ${settings.theme === "light" ? "🌙" : "☀️"}
          </button>

          <!-- Quick Action: Demo Reset -->
          <button id="reset-demo-btn" class="btn btn-secondary btn-sm" title="Reset seed demo data">
            🔄 Reset
          </button>
        </div>
      </div>

      <!-- Navigation Tabs (Role Adaptive) -->
      <nav class="app-nav" id="main-nav-tabs">
        ${
          isSchool
            ? `
          <button class="nav-tab ${state.activeTab === "school-portal" ? "active" : ""}" data-tab="school-portal">
            🏫 My Campus Hub
          </button>
        `
            : ""
        }
        <button class="nav-tab ${state.activeTab === "dashboard" ? "active" : ""}" data-tab="dashboard">
          📊 Dashboard
        </button>
        <button class="nav-tab ${state.activeTab === "checkin" ? "active" : ""}" data-tab="checkin">
          📍 Geofenced Check-In & Out
          <span class="badge-count" id="active-session-indicator" style="${state.hasActiveSession ? "" : "display:none;"}">LIVE</span>
        </button>
        <button class="nav-tab ${state.activeTab === "sessions" ? "active" : ""}" data-tab="sessions">
          🤖 Sessions & Curriculum
        </button>
        ${
          isAdmin
            ? `
          <button class="nav-tab ${state.activeTab === "finance" ? "active" : ""}" data-tab="finance">
            💰 Salary, Advances & Travel
          </button>
        `
            : ""
        }
        <button class="nav-tab ${state.activeTab === "schools" ? "active" : ""}" data-tab="schools">
          🏫 Partner Schools (12)
        </button>
        <button class="nav-tab ${state.activeTab === "inventory" ? "active" : ""}" data-tab="inventory">
          📦 Hardware Kits (6)
        </button>
        <button class="nav-tab ${state.activeTab === "staff" ? "active" : ""}" data-tab="staff">
          👥 Staff / Teachers (2)
        </button>
        ${
          isAdmin
            ? `
          <button class="nav-tab ${state.activeTab === "audit" ? "active" : ""}" data-tab="audit">
            🛰️ Location Audit Logs
          </button>
        `
            : ""
        }
      </nav>
    </header>

    <!-- Map Provider & API Key Settings Modal -->
    <div id="map-config-modal" class="modal-overlay">
      <div class="modal-dialog" style="max-width: 660px;">
        <div class="modal-header">
          <div>
            <h3>🗺️ Map Provider & API Key Settings</h3>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">Configure Leaflet tiles, Google Maps API key, or Mapbox token</p>
          </div>
          <button class="btn-icon close-map-config-btn">✕</button>
        </div>
        <div class="modal-body">
          <!-- Important Notice Banner -->
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
              <span style="font-size: 1.5rem; line-height: 1;">✅</span>
              <div>
                <strong style="color: var(--emerald-primary); font-size: 0.95rem;">Good news: No API Key is required!</strong>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.45;">
                  RoboTrack is pre-configured with free, open-source <strong>CartoDB & OpenStreetMap</strong> tiles. All maps (Check-In, Schools GPS, Campus Portal, Audit Radar) work out-of-the-box with zero setup, zero cost, and zero registration.
                </p>
              </div>
            </div>
          </div>

          <form id="map-config-form">
            <div class="form-group">
              <label class="form-label">Map Tile Provider Engine</label>
              <select id="map-provider-select" class="form-control form-select">
                <option value="free_carto" ${mapConfig.provider === "free_carto" ? "selected" : ""}>
                  🌟 CartoDB Dark/Light (Recommended • 100% Free • No API Key)
                </option>
                <option value="free_osm" ${mapConfig.provider === "free_osm" ? "selected" : ""}>
                  🌍 OpenStreetMap Standard (100% Free • No API Key)
                </option>
                <option value="google" ${mapConfig.provider === "google" ? "selected" : ""}>
                  🏢 Google Maps (Requires Google Maps API Key)
                </option>
                <option value="mapbox" ${mapConfig.provider === "mapbox" ? "selected" : ""}>
                  🛰️ Mapbox High-Res Satellite / Streets (Requires Mapbox Token)
                </option>
              </select>
            </div>

            <!-- Google Maps API Key section -->
            <div id="google-key-section" style="display: ${mapConfig.provider === "google" ? "block" : "none"}; background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label">Google Maps API Key</label>
                <input type="text" id="map-google-key" class="form-control" placeholder="AIzaSy..." value="${mapConfig.googleApiKey || ""}">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">
                  ℹ️ <strong>How to get a key:</strong> Go to <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" style="color: var(--cyan-primary);">Google Cloud Console</a> &gt; Create Project &gt; Enable <em>Maps JavaScript API / Tile API</em> &gt; Copy your API Key.
                </div>
              </div>
            </div>

            <!-- Mapbox Token section -->
            <div id="mapbox-token-section" style="display: ${mapConfig.provider === "mapbox" ? "block" : "none"}; background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label">Mapbox Public Access Token</label>
                <input type="text" id="map-mapbox-token" class="form-control" placeholder="pk.eyJ1..." value="${mapConfig.mapboxToken || ""}">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">
                  ℹ️ <strong>How to get a token:</strong> Sign up at <a href="https://account.mapbox.com/" target="_blank" style="color: var(--cyan-primary);">account.mapbox.com</a> (Includes 50,000 monthly free tile requests). Copy Default Public Token.
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Map Visual Style / Layer</label>
              <select id="map-layer-type" class="form-control form-select">
                <option value="streets" ${mapConfig.layerType === "streets" ? "selected" : ""}>🗺️ Street / Standard View</option>
                <option value="satellite" ${mapConfig.layerType === "satellite" ? "selected" : ""}>🛰️ High-Resolution Satellite View</option>
                <option value="hybrid" ${mapConfig.layerType === "hybrid" ? "selected" : ""}>🛰️ Hybrid (Satellite + Road Labels)</option>
              </select>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1.25rem;">
              <button type="button" id="reset-map-default-btn" class="btn btn-secondary btn-sm" style="margin-right: auto;">
                ↺ Reset to Free Default
              </button>
              <button type="button" class="btn btn-secondary close-map-config-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">💾 Save & Apply Map Settings</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  return headerHtml;
}

export function bindHeaderEvents(container, state, onRoleChange, onTabChange, onSettingsChange, onResetDemo, onOpenLoginModal) {
  // Open Login Modal
  const loginBtn = container.querySelector("#open-auth-modal-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      onOpenLoginModal();
    });
  }

  // Currency
  const currencySelect = container.querySelector("#currency-selector");
  if (currencySelect) {
    currencySelect.addEventListener("change", (e) => {
      const settings = getSettings();
      settings.currency = e.target.value;
      saveSettings(settings);
      onSettingsChange();
    });
  }

  // Theme
  const themeBtn = container.querySelector("#theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const settings = getSettings();
      settings.theme = settings.theme === "dark" ? "light" : "dark";
      saveSettings(settings);
      document.documentElement.setAttribute("data-theme", settings.theme);
      onSettingsChange();
    });
  }

  // Reset Demo
  const resetBtn = container.querySelector("#reset-demo-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset all data back to initial demo state? (Restores 2 teachers, 12 schools, sample sessions, advances, kits, and travel logs)")) {
        onResetDemo();
      }
    });
  }

  // Nav Tabs
  const tabs = container.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab");
      onTabChange(tabName);
    });
  });

  // Map Config Modal triggers
  const mapConfigModal = container.querySelector("#map-config-modal");
  const openMapConfigBtn = container.querySelector("#open-map-config-modal-btn");
  const closeMapConfigBtns = container.querySelectorAll(".close-map-config-btn");

  if (openMapConfigBtn && mapConfigModal) {
    openMapConfigBtn.addEventListener("click", () => {
      mapConfigModal.classList.add("active");
    });
  }

  closeMapConfigBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (mapConfigModal) mapConfigModal.classList.remove("active");
    });
  });

  // Toggle API Key input sections based on selected provider
  const providerSelect = container.querySelector("#map-provider-select");
  const googleKeySec = container.querySelector("#google-key-section");
  const mapboxTokenSec = container.querySelector("#mapbox-token-section");

  if (providerSelect) {
    providerSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (googleKeySec) googleKeySec.style.display = val === "google" ? "block" : "none";
      if (mapboxTokenSec) mapboxTokenSec.style.display = val === "mapbox" ? "block" : "none";
    });
  }

  // Submit Map Config Form
  const mapConfigForm = container.querySelector("#map-config-form");
  if (mapConfigForm) {
    mapConfigForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const provider = container.querySelector("#map-provider-select").value;
      const googleApiKey = container.querySelector("#map-google-key")?.value.trim() || "";
      const mapboxToken = container.querySelector("#map-mapbox-token")?.value.trim() || "";
      const layerType = container.querySelector("#map-layer-type").value;

      saveMapConfig({
        provider,
        googleApiKey,
        mapboxToken,
        layerType
      });

      if (mapConfigModal) mapConfigModal.classList.remove("active");
      onSettingsChange();
    });
  }

  // Reset to free default
  const resetMapDefaultBtn = container.querySelector("#reset-map-default-btn");
  if (resetMapDefaultBtn) {
    resetMapDefaultBtn.addEventListener("click", () => {
      saveMapConfig({
        provider: "free_carto",
        googleApiKey: "",
        mapboxToken: "",
        layerType: "streets"
      });
      if (mapConfigModal) mapConfigModal.classList.remove("active");
      onSettingsChange();
    });
  }
}
