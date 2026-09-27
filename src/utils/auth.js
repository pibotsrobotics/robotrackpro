// Authentication & Role-Based Access Control (RBAC) Engine for RoboTrack Pro

import { getStaff, getSchools } from "./storage.js";

const AUTH_STORAGE_KEY = "robotrack_auth_session_v1";

export const DEFAULT_ADMIN = {
  id: "admin-1",
  role: "admin",
  name: "Dr. Vikram Sarabhai",
  title: "Academy Director & STEM Lead",
  email: "admin@robolabs.edu",
  avatar: "👑"
};

/**
 * Get the currently authenticated user
 */
export function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading auth session:", err);
  }
  // Default to Admin session
  return DEFAULT_ADMIN;
}

/**
 * Save current authenticated user session
 */
export function setAuthUser(user) {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Error saving auth session:", err);
  }
}

/**
 * Log out current user
 */
export function logoutUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Authenticate user based on role and credentials / selections
 */
export function loginUser({ role, email, password, entityId }) {
  if (role === "admin") {
    // Admin login
    if (password && password !== "admin123" && password !== "admin") {
      throw new Error("Invalid admin password! (Hint: use admin123)");
    }
    const adminUser = {
      ...DEFAULT_ADMIN,
      email: email || DEFAULT_ADMIN.email
    };
    setAuthUser(adminUser);
    return adminUser;
  }

  if (role === "staff") {
    // Teacher / Instructor login
    const staffList = getStaff();
    let teacher = null;
    if (entityId) {
      teacher = staffList.find((s) => s.id === entityId);
    } else if (email) {
      teacher = staffList.find((s) => s.email.toLowerCase() === email.toLowerCase());
    }

    if (!teacher) {
      throw new Error("Teacher account not found. Please select from registered instructors.");
    }

    if (password && password !== "staff123" && password !== "staff" && password !== "123456") {
      throw new Error("Invalid staff password! (Hint: use staff123)");
    }

    const staffUser = {
      id: teacher.id,
      role: "staff",
      name: teacher.name,
      title: teacher.role,
      email: teacher.email,
      phone: teacher.phone,
      avatar: teacher.avatar || "👨‍🏫",
      wageType: teacher.wageType || (teacher.id === "staff-2" ? "monthly" : "hourly"),
      hourlyRate: teacher.hourlyRate,
      monthlySalary: teacher.monthlySalary || (teacher.id === "staff-2" ? 35000 : 0),
      dailyRate: teacher.dailyRate || 0,
      assignedSchools: teacher.assignedSchools
    };

    setAuthUser(staffUser);
    return staffUser;
  }

  if (role === "school") {
    // Partner School Coordinator / Principal login
    const schools = getSchools();
    let school = null;
    if (entityId) {
      school = schools.find((sch) => sch.id === entityId);
    } else if (email) {
      school = schools.find((sch) => sch.email && sch.email.toLowerCase() === email.toLowerCase());
    }

    if (!school) {
      throw new Error("Partner school campus not found. Please select your school.");
    }

    if (password && password !== "school123" && password !== "school" && password !== "123456") {
      throw new Error("Invalid school access password! (Hint: use school123)");
    }

    const schoolUser = {
      id: school.id,
      role: "school",
      schoolId: school.id,
      name: school.name,
      contactPerson: school.contactPerson,
      title: "School Principal / STEM Coordinator",
      email: school.email || `principal@${school.id}.edu`,
      phone: school.phone,
      address: school.address,
      avatar: "🏫",
      lat: school.lat,
      lng: school.lng,
      geofenceRadius: school.geofenceRadius,
      assignedTeachers: school.assignedTeachers,
      gradeBatches: school.gradeBatches
    };

    setAuthUser(schoolUser);
    return schoolUser;
  }

  throw new Error("Invalid role specified.");
}
