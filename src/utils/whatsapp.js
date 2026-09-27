// WhatsApp Sharing and Instant Messaging Helpers for RoboTrack Pro

import { formatCurrency } from "./storage.js";

/**
 * Format a complete session report for WhatsApp
 */
export function formatSessionWhatsAppText(session) {
  const line = "━━━━━━━━━━━━━━━━━━━━━━━";
  return `🤖 *ROBOTRACK PRO — SESSION REPORT*
${line}
📅 *Date:* ${session.date}
⏰ *Time:* ${session.checkInTime} – ${session.checkOutTime} (${session.hours} hrs)
🏫 *School:* ${session.schoolName}
👨‍🏫 *Robotics Mentor:* ${session.staffName}
🎓 *Class / Batch:* ${session.gradeBatch}
👥 *Students Trained:* ${session.studentCount} students

🎯 *Topic Taught:*
${session.topicTaught}

🧰 *Hardware Kits Deployed:*
${session.kitsUsed || "Robotics Experimenter Kits"}

📍 *GPS Verification:*
Status: ✅ ${session.checkInStatus} (On-Premises)
Coords: ${session.checkInLat.toFixed(4)}, ${session.checkInLng.toFixed(4)}
Google Maps: https://maps.google.com/?q=${session.checkInLat},${session.checkInLng}

📝 *Session Notes:*
${session.sessionNotes || "Conducted hands-on robotics session successfully."}
${line}
_Verified & Logged via RoboTrack Pro Academy System_`;
}

/**
 * Format an official salary voucher for WhatsApp
 */
export function formatPayslipWhatsAppText(staff, fin) {
  const line = "━━━━━━━━━━━━━━━━━━━━━━━";
  const isMonthly = fin.wageType === "monthly";
  const isDaily = fin.wageType === "daily";
  const rateText = isMonthly
    ? `${formatCurrency(staff.monthlySalary || fin.monthlySalary || 35000)} / month (Fixed Monthly Model)`
    : isDaily
    ? `${formatCurrency(staff.dailyRate || fin.dailyRate || 2200)} / day (Daily Model)`
    : `${formatCurrency(staff.hourlyRate || fin.hourlyRate || 750)} / hr (Hourly Model)`;
  const unitsText = isMonthly
    ? `• Monthly Scope: 1 Month (${fin.workingDays} active days, ${fin.totalHours} hrs logged)`
    : isDaily
    ? `• Active Teaching Days: ${fin.workingDays} days (${fin.totalHours} hrs logged)`
    : `• Logged Teaching Time: ${fin.totalHours} hours`;

  return `💰 *ROBOTRACK PRO — SALARY VOUCHER*
${line}
👤 *Teacher:* ${staff.name}
💼 *Role:* ${staff.role}
📅 *Cycle:* ${fin.voucherPeriod || new Date().toLocaleString("default", { month: "long", year: "numeric" })}

📊 *Work Summary:*
• Verified Sessions: ${fin.totalSessions} sessions
${unitsText}
• Contract Wage Rate: ${rateText}

💵 *Earnings Breakdown:*
• Gross Teaching Pay: ${formatCurrency(fin.earnedSalary)}
• Approved Travel Allowance: + ${formatCurrency(fin.totalTravelAllowance)}
• Advances Paid to Date: - ${formatCurrency(fin.totalAdvancesPaid || fin.unadjustedAdvance || 0)}
• Prior Disbursed Salary: - ${formatCurrency(fin.totalSalaryAlreadyPaid || 0)}

${line}
✨ *NET PENDING SALARY DUE: ${formatCurrency(fin.netPendingSalary)}*
${line}
Payment Mode: Bank Direct Transfer / UPI
Status: Verified & Approved by Academy Director

_Sent via RoboTrack Pro Finance Hub_`;
}

/**
 * Format a school robotics progress report for WhatsApp
 */
export function formatSchoolWhatsAppText(school, sessionsList) {
  const line = "━━━━━━━━━━━━━━━━━━━━━━━";
  const schoolSessions = sessionsList.filter((s) => s.schoolId === school.id);
  const totalHours = schoolSessions.reduce((acc, s) => acc + (Number(s.hours) || 0), 0);
  const totalStudents = schoolSessions.reduce((acc, s) => acc + (Number(s.studentCount) || 0), 0);

  return `🏫 *ROBOTRACK PRO — SCHOOL REPORT*
${line}
*Institution:* ${school.name}
*Principal / Contact:* ${school.contactPerson} (${school.phone})
*Assigned Robotics Faculty:* ${school.assignedTeachers.join(", ")}
*Class Batches:* ${school.gradeBatches}

📊 *Academy Metrics:*
• Completed Sessions: ${schoolSessions.length}
• Total Lab Hours: ${Math.round(totalHours * 10) / 10} hrs
• Student Enrollments: ${school.studentCount} students
• Current Topic / Lab: ${school.currentTopic || "Robotics Foundations"}
• Next Scheduled Days: ${school.scheduleDays.join(" & ")} (${school.preferredTime})

${line}
_RoboTrack Pro Academy Management_`;
}

/**
 * Launch WhatsApp with message
 */
export function openWhatsApp(messageText, phone = "") {
  const encoded = encodeURIComponent(messageText);
  const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, "_blank");
}

/**
 * Copy formatted message text with Toast notification
 */
export async function copyTextWithFeedback(text, showToast) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      if (showToast) showToast("Copied to clipboard! Ready to paste into WhatsApp / Email.", "success");
    } else {
      // Fallback textarea
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      if (showToast) showToast("Copied to clipboard! Ready to paste.", "success");
    }
  } catch (err) {
    if (showToast) showToast("Failed to copy automatically. Please copy manually.", "error");
  }
}
