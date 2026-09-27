// LocalStorage State Manager & Payroll Engine for RoboTrack Pro

import {
  INITIAL_CURRICULUM,
  INITIAL_STAFF,
  INITIAL_SCHOOLS,
  INITIAL_SESSIONS,
  INITIAL_ADVANCES,
  INITIAL_TRAVEL_EXPENSES,
  INITIAL_SALARY_PAYMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_KITS
} from "../data/mockData.js";
import { checkGeofence } from "./geo.js";

const STORAGE_KEYS = {
  CURRICULUM: "robotrack_curriculum_v1",
  STAFF: "robotrack_staff_v1",
  SCHOOLS: "robotrack_schools_v1",
  SESSIONS: "robotrack_sessions_v1",
  ADVANCES: "robotrack_advances_v1",
  TRAVEL: "robotrack_travel_v1",
  PAYMENTS: "robotrack_payments_v1",
  AUDIT: "robotrack_audit_v1",
  KITS: "robotrack_kits_v1",
  ACTIVE_SESSION_PREFIX: "robotrack_active_sess_",
  SETTINGS: "robotrack_settings_v1",
  MAP_CONFIG: "robotrack_map_config_v1"
};

function getFromStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// Initialize default state if first time
export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
    setToStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
    setToStorage(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    setToStorage(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ADVANCES)) {
    setToStorage(STORAGE_KEYS.ADVANCES, INITIAL_ADVANCES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRAVEL)) {
    setToStorage(STORAGE_KEYS.TRAVEL, INITIAL_TRAVEL_EXPENSES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    setToStorage(STORAGE_KEYS.PAYMENTS, INITIAL_SALARY_PAYMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
    setToStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRICULUM)) {
    setToStorage(STORAGE_KEYS.CURRICULUM, INITIAL_CURRICULUM);
  }
  if (!localStorage.getItem(STORAGE_KEYS.KITS)) {
    setToStorage(STORAGE_KEYS.KITS, INITIAL_KITS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setToStorage(STORAGE_KEYS.SETTINGS, {
      currency: "₹",
      currencyCode: "INR",
      theme: "dark",
      strictGeofence: true
    });
  }
}

// Getters
export const getCurriculum = () => getFromStorage(STORAGE_KEYS.CURRICULUM, INITIAL_CURRICULUM);
export const getStaff = () => {
  const staff = getFromStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  let changed = false;
  staff.forEach((s) => {
    if (!s.wageType || (s.id === "staff-2" && s.wageType !== "monthly")) {
      s.wageType = s.id === "staff-2" ? "monthly" : "hourly";
      changed = true;
    }
    if (s.wageType === "monthly" && (!s.monthlySalary || s.monthlySalary === 0)) {
      s.monthlySalary = 35000;
      changed = true;
    }
    if (s.wageType === "hourly" && (!s.hourlyRate || s.hourlyRate === 0)) {
      s.hourlyRate = 750;
      changed = true;
    }
    if (s.wageType === "daily" && (!s.dailyRate || s.dailyRate === 0)) {
      s.dailyRate = 2200;
      changed = true;
    }
  });
  if (changed) {
    setToStorage(STORAGE_KEYS.STAFF, staff);
  }
  return staff;
};
export const getSchools = () => getFromStorage(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
export const getSessions = () => getFromStorage(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
export const getAdvances = () => getFromStorage(STORAGE_KEYS.ADVANCES, INITIAL_ADVANCES);
export const getTravelExpenses = () => getFromStorage(STORAGE_KEYS.TRAVEL, INITIAL_TRAVEL_EXPENSES);
export const getSalaryPayments = () => getFromStorage(STORAGE_KEYS.PAYMENTS, INITIAL_SALARY_PAYMENTS);
export const getAuditLogs = () => getFromStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
export const getKits = () => getFromStorage(STORAGE_KEYS.KITS, INITIAL_KITS);
export const getSettings = () => getFromStorage(STORAGE_KEYS.SETTINGS, { currency: "₹", theme: "dark", strictGeofence: true });
export const getMapConfig = () => getFromStorage(STORAGE_KEYS.MAP_CONFIG, {
  provider: "free_carto", // "free_carto", "free_osm", "google", "mapbox"
  googleApiKey: "",
  mapboxToken: "",
  layerType: "streets" // "streets", "satellite", "hybrid"
});

// Setters / Updates
export const saveStaff = (staff) => setToStorage(STORAGE_KEYS.STAFF, staff);
export const saveSchools = (schools) => setToStorage(STORAGE_KEYS.SCHOOLS, schools);
export const saveSessions = (sessions) => setToStorage(STORAGE_KEYS.SESSIONS, sessions);
export const saveAdvances = (advances) => setToStorage(STORAGE_KEYS.ADVANCES, advances);
export const saveTravelExpenses = (travel) => setToStorage(STORAGE_KEYS.TRAVEL, travel);
export const saveSalaryPayments = (payments) => setToStorage(STORAGE_KEYS.PAYMENTS, payments);
export const saveAuditLogs = (logs) => setToStorage(STORAGE_KEYS.AUDIT, logs);
export const saveKits = (kits) => setToStorage(STORAGE_KEYS.KITS, kits);
export const saveSettings = (settings) => setToStorage(STORAGE_KEYS.SETTINGS, settings);
export const saveMapConfig = (config) => setToStorage(STORAGE_KEYS.MAP_CONFIG, config);

/**
 * Returns dynamic tile layer configuration based on provider & custom API key
 */
export function getMapTileConfig(theme = "dark") {
  const config = getMapConfig();
  if (config.provider === "google" && config.googleApiKey) {
    const lyrs = config.layerType === "satellite" ? "s" : config.layerType === "hybrid" ? "y" : "m";
    return {
      url: `https://mt1.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}&key=${config.googleApiKey}`,
      attribution: "© Google Maps",
      maxZoom: 20
    };
  } else if (config.provider === "mapbox" && config.mapboxToken) {
    const styleId = config.layerType === "satellite"
      ? "satellite-v9"
      : config.layerType === "hybrid"
      ? "satellite-streets-v12"
      : (theme === "light" ? "light-v11" : "dark-v11");
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/{z}/{x}/{y}?access_token=${config.mapboxToken}`,
      attribution: "© Mapbox © OpenStreetMap",
      maxZoom: 19
    };
  } else if (config.provider === "free_osm") {
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19
    };
  } else {
    // Default: 100% Free CartoDB Tiles (Zero API Key Required)
    const url = theme === "light"
      ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";
    return {
      url,
      attribution: "© CartoDB © OpenStreetMap (100% Free • No API Key Needed)",
      maxZoom: 19
    };
  }
}

// ==========================================
// FULL CRUD OPERATIONS
// ==========================================

// --- Staff CRUD ---
export function addStaff(staffData) {
  const staffList = getStaff();
  const wageType = staffData.wageType || "hourly";
  const newStaff = {
    id: `staff-${Date.now()}`,
    name: staffData.name,
    role: staffData.role || "Robotics Trainer & STEM Mentor",
    email: staffData.email,
    phone: staffData.phone,
    avatar: staffData.avatar || "👨‍🏫",
    wageType, // "hourly", "monthly", or "daily"
    hourlyRate: wageType === "hourly" ? (Number(staffData.hourlyRate) || 750) : 0,
    monthlySalary: wageType === "monthly" ? (Number(staffData.monthlySalary) || 35000) : 0,
    dailyRate: wageType === "daily" ? (Number(staffData.dailyRate) || 2200) : 0,
    travelRatePerKm: Number(staffData.travelRatePerKm) || 15,
    travelPolicy: "Request-Based Only (No Flat Rate Allowed)",
    assignedSchools: staffData.assignedSchools || [],
    specialty: staffData.specialty || "Robotics & Microcontrollers",
    status: "Active",
    joinedDate: staffData.joinedDate || new Date().toISOString().split("T")[0]
  };
  staffList.push(newStaff);
  saveStaff(staffList);
  return newStaff;
}

export function updateStaff(staffId, data) {
  const staffList = getStaff();
  const idx = staffList.findIndex((s) => s.id === staffId);
  if (idx === -1) throw new Error("Staff member not found");
  
  const current = staffList[idx];
  const wageType = data.wageType !== undefined ? data.wageType : (current.wageType || "hourly");
  
  staffList[idx] = {
    ...current,
    ...data,
    wageType,
    hourlyRate: wageType === "hourly" ? (Number(data.hourlyRate !== undefined ? data.hourlyRate : current.hourlyRate) || 750) : 0,
    monthlySalary: wageType === "monthly" ? (Number(data.monthlySalary !== undefined ? data.monthlySalary : current.monthlySalary) || 35000) : 0,
    dailyRate: wageType === "daily" ? (Number(data.dailyRate !== undefined ? data.dailyRate : current.dailyRate) || 2200) : 0
  };
  
  saveStaff(staffList);
  return staffList[idx];
}

export function deleteStaff(staffId) {
  const staffList = getStaff();
  const filtered = staffList.filter((s) => s.id !== staffId);
  saveStaff(filtered);
  return true;
}

// --- School CRUD ---
export function addSchool(schoolData) {
  const schools = getSchools();
  const newSchool = {
    id: `school-${Date.now()}`,
    name: schoolData.name,
    address: schoolData.address,
    contactPerson: schoolData.contactPerson || "Principal",
    phone: schoolData.phone || "",
    email: schoolData.email || "",
    lat: Number(schoolData.lat) || 13.0827,
    lng: Number(schoolData.lng) || 80.2707,
    geofenceRadius: Number(schoolData.geofenceRadius) || 250,
    assignedTeachers: schoolData.assignedTeachers || [],
    scheduleDays: schoolData.scheduleDays || ["Monday", "Thursday"],
    preferredTime: schoolData.preferredTime || "09:00 - 12:00",
    gradeBatches: schoolData.gradeBatches || "Grade 6 to 8",
    studentCount: Number(schoolData.studentCount) || 30,
    currentTopic: schoolData.currentTopic || "Module 1: Foundations",
    kitsAllocated: schoolData.kitsAllocated || "Robotics Kit Pod"
  };
  schools.push(newSchool);
  saveSchools(schools);
  return newSchool;
}

export function updateSchool(schoolId, data) {
  const schools = getSchools();
  const idx = schools.findIndex((s) => s.id === schoolId);
  if (idx === -1) throw new Error("School not found");
  schools[idx] = { ...schools[idx], ...data };
  saveSchools(schools);
  return schools[idx];
}

export function deleteSchool(schoolId) {
  const schools = getSchools();
  const filtered = schools.filter((s) => s.id !== schoolId);
  saveSchools(filtered);
  return true;
}

// --- Hardware Kit CRUD ---
export function addKit(kitData) {
  const kits = getKits();
  const total = Number(kitData.totalUnits) || 10;
  const newKit = {
    id: `kit-${Date.now()}`,
    name: kitData.name,
    sku: kitData.sku || `KIT-${Date.now().toString().slice(-4)}`,
    category: kitData.category || "Microcontrollers",
    totalUnits: total,
    deployedCount: 0,
    baseLabCount: total,
    inTransitCount: 0,
    maintenanceCount: 0,
    currentHolders: [],
    components: kitData.components || "Standard Robotics Components",
    condition: kitData.condition || "Excellent (100%)",
    status: "Active",
    notes: kitData.notes || ""
  };
  kits.push(newKit);
  saveKits(kits);
  return newKit;
}

export function updateKit(kitId, data) {
  const kits = getKits();
  const idx = kits.findIndex((k) => k.id === kitId);
  if (idx === -1) throw new Error("Kit not found");
  kits[idx] = { ...kits[idx], ...data };
  saveKits(kits);
  return kits[idx];
}

export function deleteKit(kitId) {
  const kits = getKits();
  const filtered = kits.filter((k) => k.id !== kitId);
  saveKits(filtered);
  return true;
}

// --- Session CRUD ---
export function addSession(sessionData) {
  const sessions = getSessions();
  const newSession = {
    id: sessionData.id || `sess-${Date.now()}`,
    ...sessionData
  };
  sessions.unshift(newSession);
  saveSessions(sessions);
  return newSession;
}

export function updateSession(sessionId, data) {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) throw new Error("Session not found");
  sessions[idx] = { ...sessions[idx], ...data };
  saveSessions(sessions);
  return sessions[idx];
}

export function deleteSession(sessionId) {
  const sessions = getSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveSessions(filtered);
  return true;
}

// --- Finance CRUD ---
export function deleteAdvancePayment(advanceId) {
  const advances = getAdvances();
  const filtered = advances.filter((a) => a.id !== advanceId);
  saveAdvances(filtered);
  return true;
}

export function deleteTravelExpense(travelId) {
  const travelList = getTravelExpenses();
  const filtered = travelList.filter((t) => t.id !== travelId);
  saveTravelExpenses(filtered);
  return true;
}

/**
 * Check out kits to a teacher or school
 */
export function checkoutKit({ kitId, holderType, holderId, holderName, units, notes = "" }) {
  const kits = getKits();
  const kit = kits.find((k) => k.id === kitId);
  if (!kit) throw new Error("Kit not found");

  const count = Number(units) || 1;
  if (kit.baseLabCount < count) {
    throw new Error(`Insufficient kits in Base Lab! Only ${kit.baseLabCount} available.`);
  }

  kit.baseLabCount -= count;
  if (holderType === "teacher") {
    kit.inTransitCount = (kit.inTransitCount || 0) + count;
  } else {
    kit.deployedCount = (kit.deployedCount || 0) + count;
  }

  // Update or push holder
  if (!kit.currentHolders) kit.currentHolders = [];
  const existing = kit.currentHolders.find((h) => h.holderId === holderId);
  if (existing) {
    existing.units = (existing.units || 0) + count;
    existing.assignedDate = new Date().toISOString().split("T")[0];
  } else {
    kit.currentHolders.push({
      holderType,
      holderId,
      holderName,
      units: count,
      assignedDate: new Date().toISOString().split("T")[0],
      notes
    });
  }

  saveKits(kits);
  return kit;
}

/**
 * Return kits back to Base Lab
 */
export function returnKit({ kitId, holderId, units, returnCondition, notes = "" }) {
  const kits = getKits();
  const kit = kits.find((k) => k.id === kitId);
  if (!kit) throw new Error("Kit not found");

  const count = Number(units) || 1;
  if (!kit.currentHolders) kit.currentHolders = [];
  const holderIdx = kit.currentHolders.findIndex((h) => h.holderId === holderId);

  if (holderIdx !== -1) {
    const holder = kit.currentHolders[holderIdx];
    const holderUnits = holder.units || count;
    const actualReturn = Math.min(count, holderUnits);

    if (holder.holderType === "teacher") {
      kit.inTransitCount = Math.max(0, (kit.inTransitCount || 0) - actualReturn);
    } else {
      kit.deployedCount = Math.max(0, (kit.deployedCount || 0) - actualReturn);
    }

    kit.baseLabCount += actualReturn;
    holder.units -= actualReturn;

    if (holder.units <= 0) {
      kit.currentHolders.splice(holderIdx, 1);
    }
  } else {
    kit.baseLabCount += count;
  }

  if (returnCondition) {
    kit.condition = returnCondition;
  }

  saveKits(kits);
  return kit;
}

// Active Check-in tracker per teacher
export function getActiveSession(staffId) {
  return getFromStorage(`${STORAGE_KEYS.ACTIVE_SESSION_PREFIX}${staffId}`, null);
}

export function setActiveSession(staffId, session) {
  if (session) {
    setToStorage(`${STORAGE_KEYS.ACTIVE_SESSION_PREFIX}${staffId}`, session);
  } else {
    localStorage.removeItem(`${STORAGE_KEYS.ACTIVE_SESSION_PREFIX}${staffId}`);
  }
}

/**
 * Handle staff Check-In with Geofence Verification
 */
export function checkInTeacher({ staffId, schoolId, userCoords, device = "Web Browser / GPS" }) {
  const staffList = getStaff();
  const schoolList = getSchools();
  const staff = staffList.find((s) => s.id === staffId);
  const school = schoolList.find((s) => s.id === schoolId);

  if (!staff || !school) {
    throw new Error("Invalid staff or school selection.");
  }

  // Check geofence
  const geoResult = checkGeofence(
    userCoords.lat,
    userCoords.lng,
    school.lat,
    school.lng,
    school.geofenceRadius
  );

  const timestamp = new Date().toISOString();
  const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const auditEntry = {
    id: `audit-${Date.now()}`,
    timestamp,
    staffId: staff.id,
    staffName: staff.name,
    schoolId: school.id,
    schoolName: school.name,
    action: "CHECK_IN",
    attemptLat: userCoords.lat,
    attemptLng: userCoords.lng,
    schoolLat: school.lat,
    schoolLng: school.lng,
    distanceMeters: geoResult.distanceMeters,
    geofenceRadius: school.geofenceRadius,
    status: geoResult.isInside ? "VERIFIED" : "REJECTED_OUT_OF_RANGE",
    device,
    notes: geoResult.isInside
      ? `Verified at school (Distance: ${Math.round(geoResult.distanceMeters)}m, within ${school.geofenceRadius}m radius)`
      : `Rejected: Located ${Math.round(geoResult.distanceMeters)}m away (Radius is ${school.geofenceRadius}m)`
  };

  // Record audit log
  const auditLogs = getAuditLogs();
  auditLogs.unshift(auditEntry);
  saveAuditLogs(auditLogs);

  if (!geoResult.isInside) {
    return {
      success: false,
      reason: `Location verification failed! You are ${Math.round(geoResult.distanceMeters)} meters away from ${school.name}. Check-in is only allowed within ${school.geofenceRadius} meters of the school premises.`,
      distanceMeters: geoResult.distanceMeters,
      radiusMeters: school.geofenceRadius,
      auditEntry
    };
  }

  // Inside geofence -> Create active session
  const activeSession = {
    id: `active-${Date.now()}`,
    staffId: staff.id,
    staffName: staff.name,
    schoolId: school.id,
    schoolName: school.name,
    date: new Date().toISOString().split("T")[0],
    checkInTime: timeString,
    checkInTimestamp: Date.now(),
    checkInLat: userCoords.lat,
    checkInLng: userCoords.lng,
    checkInAccuracy: userCoords.accuracy || 10,
    checkInStatus: "VERIFIED",
    geofenceRadius: school.geofenceRadius
  };

  setActiveSession(staffId, activeSession);

  return {
    success: true,
    activeSession,
    distanceMeters: geoResult.distanceMeters,
    auditEntry
  };
}

/**
 * Handle staff Check-Out and Topic Log Submission
 */
export function checkOutTeacher({
  staffId,
  sessionDetails,
  userCoords,
  device = "Web Browser / GPS",
  bypassGeofence = false
}) {
  const activeSession = getActiveSession(staffId);
  if (!activeSession) {
    throw new Error("No active check-in found for this teacher.");
  }

  const schoolList = getSchools();
  const school = schoolList.find((s) => s.id === activeSession.schoolId);
  const geoResult = checkGeofence(
    userCoords.lat,
    userCoords.lng,
    school ? school.lat : activeSession.checkInLat,
    school ? school.lng : activeSession.checkInLng,
    school ? school.geofenceRadius : 250
  );

  const timestamp = new Date().toISOString();
  const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const auditEntry = {
    id: `audit-${Date.now()}`,
    timestamp,
    staffId: activeSession.staffId,
    staffName: activeSession.staffName,
    schoolId: activeSession.schoolId,
    schoolName: activeSession.schoolName,
    action: "CHECK_OUT",
    attemptLat: userCoords.lat,
    attemptLng: userCoords.lng,
    schoolLat: school ? school.lat : 0,
    schoolLng: school ? school.lng : 0,
    distanceMeters: geoResult.distanceMeters,
    geofenceRadius: school ? school.geofenceRadius : 250,
    status: geoResult.isInside || bypassGeofence ? "VERIFIED" : "REJECTED_OUT_OF_RANGE",
    device,
    notes: geoResult.isInside
      ? `Check-out verified (Distance: ${Math.round(geoResult.distanceMeters)}m from school)`
      : `Check-out attempt outside boundary (${Math.round(geoResult.distanceMeters)}m away)`
  };

  const auditLogs = getAuditLogs();
  auditLogs.unshift(auditEntry);
  saveAuditLogs(auditLogs);

  if (!geoResult.isInside && !bypassGeofence) {
    return {
      success: false,
      reason: `Check-out location mismatch! You are ${Math.round(geoResult.distanceMeters)}m away from ${activeSession.schoolName}. You must check out while still on school premises.`,
      distanceMeters: geoResult.distanceMeters,
      auditEntry
    };
  }

  // Calculate duration in hours
  const checkInMs = activeSession.checkInTimestamp || Date.now() - 3 * 3600 * 1000;
  const elapsedMs = Math.max(Date.now() - checkInMs, 15 * 60 * 1000); // minimum 15 mins
  const hours = Math.round((elapsedMs / (1000 * 60 * 60)) * 100) / 100;

  // Complete session object
  const sessionId = `sess-${Date.now()}`;
  const travelClaimId = sessionDetails.travelClaim ? `trv-${Date.now()}` : null;

  const completedSession = {
    id: sessionId,
    staffId: activeSession.staffId,
    staffName: activeSession.staffName,
    schoolId: activeSession.schoolId,
    schoolName: activeSession.schoolName,
    date: activeSession.date,
    checkInTime: activeSession.checkInTime,
    checkOutTime: timeString,
    hours: sessionDetails.customHours ? Number(sessionDetails.customHours) : hours,
    topicTaught: sessionDetails.topicTaught || "Robotics Practical & Hands-on Lab",
    gradeBatch: sessionDetails.gradeBatch || "Robotics Batch",
    studentCount: Number(sessionDetails.studentCount) || 30,
    kitsUsed: sessionDetails.kitsUsed || "Robotics Kits & Microcontrollers",
    sessionNotes: sessionDetails.sessionNotes || "Session conducted smoothly.",
    checkInLat: activeSession.checkInLat,
    checkInLng: activeSession.checkInLng,
    checkInAccuracy: activeSession.checkInAccuracy,
    checkInStatus: "VERIFIED",
    checkOutLat: userCoords.lat,
    checkOutLng: userCoords.lng,
    checkOutStatus: "VERIFIED",
    travelClaimId
  };

  // Save session
  const sessions = getSessions();
  sessions.unshift(completedSession);
  saveSessions(sessions);

  // If travel claim requested
  if (sessionDetails.travelClaim && Number(sessionDetails.travelAmount) > 0) {
    const travelList = getTravelExpenses();
    const newTravel = {
      id: travelClaimId,
      sessionId,
      staffId: activeSession.staffId,
      staffName: activeSession.staffName,
      schoolId: activeSession.schoolId,
      schoolName: activeSession.schoolName,
      date: activeSession.date,
      mode: sessionDetails.travelMode || "Two-Wheeler",
      distanceKm: Number(sessionDetails.travelDistanceKm) || 0,
      ratePerKm: 15,
      amount: Number(sessionDetails.travelAmount),
      claimType: "Requested Visit Allowance",
      receiptNo: `TRV-${Date.now().toString().slice(-6)}`,
      status: "Pending", // Request-based: awaiting director review/approval
      notes: sessionDetails.travelNotes || "Staff travel allowance reimbursement request"
    };
    travelList.unshift(newTravel);
    saveTravelExpenses(travelList);
  }

  // Update School's current topic
  if (school && sessionDetails.topicTaught) {
    school.currentTopic = sessionDetails.topicTaught;
    saveSchools(schoolList);
  }

  // Clear active session
  setActiveSession(staffId, null);

  return {
    success: true,
    completedSession,
    hours,
    auditEntry
  };
}

/**
 * Record an advance payment to a staff member
 */
export function addAdvancePayment(advanceData) {
  const advances = getAdvances();
  const staffList = getStaff();
  const staff = staffList.find((s) => s.id === advanceData.staffId);

  const newAdvance = {
    id: `adv-${Date.now()}`,
    staffId: advanceData.staffId,
    staffName: staff ? staff.name : advanceData.staffName,
    date: advanceData.date || new Date().toISOString().split("T")[0],
    amount: Number(advanceData.amount),
    paymentMode: advanceData.paymentMode || "Bank Transfer",
    referenceNo: advanceData.referenceNo || `ADV-${Date.now().toString().slice(-6)}`,
    reason: advanceData.reason || "Advance payment",
    status: "Completed",
    recordedBy: advanceData.recordedBy || "Admin / Director",
    notes: advanceData.notes || ""
  };

  advances.unshift(newAdvance);
  saveAdvances(advances);
  return newAdvance;
}

/**
 * Record a travel expense claim
 */
export function addTravelExpense(expenseData) {
  const travelList = getTravelExpenses();
  const staffList = getStaff();
  const schoolList = getSchools();
  const staff = staffList.find((s) => s.id === expenseData.staffId);
  const school = schoolList.find((s) => s.id === expenseData.schoolId);

  const newExpense = {
    id: `trv-${Date.now()}`,
    sessionId: expenseData.sessionId || null,
    staffId: expenseData.staffId,
    staffName: staff ? staff.name : expenseData.staffName,
    schoolId: expenseData.schoolId,
    schoolName: school ? school.name : expenseData.schoolName,
    date: expenseData.date || new Date().toISOString().split("T")[0],
    mode: expenseData.mode || "Two-Wheeler",
    distanceKm: Number(expenseData.distanceKm) || 0,
    ratePerKm: Number(expenseData.ratePerKm) || 15,
    amount: Number(expenseData.amount) || 0,
    claimType: expenseData.claimType || "Requested Travel Allowance",
    receiptNo: expenseData.receiptNo || `TRV-${Date.now().toString().slice(-6)}`,
    status: expenseData.status || "Pending",
    notes: expenseData.notes || ""
  };

  travelList.unshift(newExpense);
  saveTravelExpenses(travelList);
  return newExpense;
}

/**
 * Approve or update travel expense status
 */
export function updateTravelStatus(travelId, newStatus) {
  const travelList = getTravelExpenses();
  const item = travelList.find((t) => t.id === travelId);
  if (item) {
    item.status = newStatus;
    saveTravelExpenses(travelList);
  }
  return item;
}

export function updateTravelExpense(travelId, data) {
  const travelList = getTravelExpenses();
  const idx = travelList.findIndex((t) => t.id === travelId);
  if (idx !== -1) {
    travelList[idx] = { ...travelList[idx], ...data };
    saveTravelExpenses(travelList);
    return travelList[idx];
  }
  return null;
}

/**
 * Calculate comprehensive financial metrics for a staff member
 */
export function calculateStaffFinancials(staffId) {
  const staffList = getStaff();
  const staff = staffList.find((s) => s.id === staffId);
  if (!staff) return null;

  const sessions = getSessions().filter((s) => s.staffId === staffId);
  const advances = getAdvances().filter((a) => a.staffId === staffId && a.status === "Completed");
  const travelClaims = getTravelExpenses().filter((t) => t.staffId === staffId && t.status === "Approved");
  const pastPayments = getSalaryPayments().filter((p) => p.staffId === staffId && p.status === "Completed");

  // Sum hours
  const totalHours = sessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
  const roundedHours = Math.round(totalHours * 100) / 100;

  // Calculate unique working days where verified sessions were held
  const uniqueDates = [...new Set(sessions.map((s) => s.date).filter(Boolean))];
  const workingDays = uniqueDates.length;

  // Determine wage type (Alex Morgan = hourly, Priya Sharma = monthly by default)
  const wageType = staff.wageType || (staff.id === "staff-2" ? "monthly" : "hourly");
  const hourlyRate = Number(staff.hourlyRate) || (wageType === "hourly" ? 750 : 0);
  const monthlySalary = Number(staff.monthlySalary) || (wageType === "monthly" ? 35000 : 0);
  const dailyRate = Number(staff.dailyRate) || (wageType === "daily" ? 2200 : 0);

  let rate = hourlyRate || 750;
  let rateFormatted = `${formatCurrency(hourlyRate || 750)} / hr`;
  let unitsFormatted = `${roundedHours} hrs`;
  let earnedSalary = 0;

  if (wageType === "monthly") {
    rate = monthlySalary || 35000;
    rateFormatted = `${formatCurrency(rate)} / month`;
    unitsFormatted = `Monthly (${workingDays} days, ${roundedHours} hrs)`;
    earnedSalary = rate;
  } else if (wageType === "daily") {
    rate = dailyRate || 2200;
    rateFormatted = `${formatCurrency(rate)} / day`;
    unitsFormatted = `${workingDays} active days`;
    earnedSalary = Math.round(workingDays * rate);
  } else {
    rate = hourlyRate || 750;
    rateFormatted = `${formatCurrency(rate)} / hr`;
    unitsFormatted = `${roundedHours} hrs`;
    earnedSalary = Math.round(roundedHours * rate);
  }

  // Total approved travel allowances
  const totalTravelAllowance = travelClaims.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Total Advances paid
  const totalAdvancesPaid = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // Prior salary already disbursed
  const totalSalaryAlreadyPaid = pastPayments.reduce((sum, p) => sum + (Number(p.earnedSalary) || 0), 0);
  const totalTravelAlreadyPaid = pastPayments.reduce((sum, p) => sum + (Number(p.travelAllowance) || 0), 0);
  const totalAdvanceDeductedInPast = pastPayments.reduce((sum, p) => sum + (Number(p.advanceDeducted) || 0), 0);

  // Active unadjusted advances
  const unadjustedAdvance = Math.max(0, totalAdvancesPaid - totalAdvanceDeductedInPast);

  // Unpaid teaching earnings
  const unpaidEarnedSalary = Math.max(0, earnedSalary - totalSalaryAlreadyPaid);

  // Unpaid travel allowances
  const unpaidTravelAllowance = Math.max(0, totalTravelAllowance - totalTravelAlreadyPaid);

  // Gross pending payable before advance deduction
  const grossPending = unpaidEarnedSalary + unpaidTravelAllowance;

  // Net Pending Salary (after deducting unadjusted advance)
  const netPendingSalary = Math.max(0, grossPending - unadjustedAdvance);

  return {
    staffId: staff.id,
    staffName: staff.name,
    wageType, // "hourly", "monthly", or "daily"
    rate,
    hourlyRate,
    monthlySalary,
    dailyRate,
    rateFormatted,
    unitsFormatted,
    workingDays,
    totalSessions: sessions.length,
    totalHours: roundedHours,
    earnedSalary, // lifetime earned
    totalTravelAllowance, // lifetime travel
    totalAdvancesPaid, // lifetime advances paid
    totalSalaryAlreadyPaid,
    unadjustedAdvance, // current active advance balance
    unpaidEarnedSalary,
    unpaidTravelAllowance,
    grossPending,
    netPendingSalary, // what is currently owed to teacher
    sessions,
    advances,
    travelClaims,
    pastPayments
  };
}

/**
 * Disburse / Settle Salary Payment to a Teacher
 */
export function recordSalaryDisbursement({
  staffId,
  period,
  paymentMode,
  referenceNo,
  deductAdvanceAmount,
  customPayAmount,
  notes
}) {
  const fin = calculateStaffFinancials(staffId);
  const staff = getStaff().find((s) => s.id === staffId);
  if (!fin || !staff) throw new Error("Staff member not found");

  const advanceToDeduct = Math.min(Number(deductAdvanceAmount) || 0, fin.unadjustedAdvance);
  const grossToPay = fin.unpaidEarnedSalary + fin.unpaidTravelAllowance;
  const netAmount = customPayAmount !== undefined && customPayAmount !== null && customPayAmount !== ""
    ? Number(customPayAmount)
    : Math.max(0, grossToPay - advanceToDeduct);

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    staffId: staff.id,
    staffName: staff.name,
    period: period || `Cycle to ${new Date().toLocaleDateString()}`,
    date: new Date().toISOString().split("T")[0],
    wageType: fin.wageType,
    unitCount: fin.wageType === "monthly" ? "1 Month" : (fin.wageType === "daily" ? `${fin.workingDays} days` : `${fin.totalHours} hrs`),
    totalHours: fin.totalHours,
    workingDays: fin.workingDays,
    rate: fin.rate,
    hourlyRate: fin.hourlyRate,
    monthlySalary: fin.monthlySalary,
    dailyRate: fin.dailyRate,
    earnedSalary: fin.unpaidEarnedSalary,
    travelAllowance: fin.unpaidTravelAllowance,
    advanceDeducted: advanceToDeduct,
    netPaid: netAmount,
    paymentMode: paymentMode || "Bank Transfer",
    referenceNo: referenceNo || `SAL-${Date.now().toString().slice(-6)}`,
    status: "Completed",
    notes: notes || "Salary settlement disbursed"
  };

  const payments = getSalaryPayments();
  payments.unshift(paymentRecord);
  saveSalaryPayments(payments);

  return paymentRecord;
}

/**
 * Format currency with configured symbol
 */
export function formatCurrency(amount) {
  const settings = getSettings();
  const num = Number(amount) || 0;
  return `${settings.currency} ${num.toLocaleString()}`;
}

/**
 * Reset all application data back to initial seed data
 */
export function resetToDemoData() {
  setToStorage(STORAGE_KEYS.CURRICULUM, INITIAL_CURRICULUM);
  setToStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  setToStorage(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
  setToStorage(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  setToStorage(STORAGE_KEYS.ADVANCES, INITIAL_ADVANCES);
  setToStorage(STORAGE_KEYS.TRAVEL, INITIAL_TRAVEL_EXPENSES);
  setToStorage(STORAGE_KEYS.PAYMENTS, INITIAL_SALARY_PAYMENTS);
  setToStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  setToStorage(STORAGE_KEYS.KITS, INITIAL_KITS);
}

/**
 * Export data to JSON file
 */
export function exportDataAsJSON() {
  const fullBackup = {
    staff: getStaff(),
    schools: getSchools(),
    sessions: getSessions(),
    advances: getAdvances(),
    travel: getTravelExpenses(),
    payments: getSalaryPayments(),
    audit: getAuditLogs(),
    curriculum: getCurriculum(),
    kits: getKits(),
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `robotrack-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export payroll statement as CSV
 */
export function exportPayrollCSV() {
  const staffList = getStaff();
  let csv = "Teacher Name,Wage Model,Rate,Units Worked,Total Sessions,Total Hours,Gross Teaching Pay,Travel Allowance,Advances Paid,Settled Prior,Net Pending Balance\n";

  staffList.forEach((s) => {
    const fin = calculateStaffFinancials(s.id);
    const wageModelLabel = fin.wageType === "monthly" ? "Per Month" : (fin.wageType === "daily" ? "Per Day" : "Per Hour");
    const unitsWorked = fin.wageType === "monthly" ? `1 Month (${fin.totalSessions} sessions)` : (fin.wageType === "daily" ? `${fin.workingDays} days` : `${fin.totalHours} hrs`);
    csv += `"${s.name}","${wageModelLabel}","${fin.rateFormatted}","${unitsWorked}",${fin.totalSessions},${fin.totalHours},${fin.earnedSalary},${fin.totalTravelAllowance},${fin.totalAdvancesPaid},${fin.totalSalaryAlreadyPaid},${fin.netPendingSalary}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `robotrack-payroll-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export attendance & topic log as CSV
 */
export function exportAttendanceCSV() {
  const sessions = getSessions();
  let csv = "Date,Teacher,School,Topic Taught,Grade/Batch,Hours,Check-In Time,Check-Out Time,Check-In Lat,Check-In Lng,Status,Students,Kits Used\n";

  sessions.forEach((s) => {
    csv += `"${s.date}","${s.staffName}","${s.schoolName}","${s.topicTaught.replace(/"/g, '""')}","${s.gradeBatch}",${s.hours},"${s.checkInTime}","${s.checkOutTime}",${s.checkInLat},${s.checkInLng},"${s.checkInStatus}",${s.studentCount},"${(s.kitsUsed || "").replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `robotrack-attendance-sessions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
