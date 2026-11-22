import type { EmployeeLifecycleStatus, EmploymentType, Gender, HrDocumentCategory } from "@/types/entities";

export const LIFECYCLE_LABELS: Record<EmployeeLifecycleStatus, string> = {
  ONBOARDING: "Onboarding",
  PROBATION: "Probation",
  CONFIRMED: "Confirmed",
  NOTICE: "Notice Period",
  EXITED: "Exited",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERN: "Intern",
  CONSULTANT: "Consultant",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  UNDISCLOSED: "Prefer not to say",
};

export const DOCUMENT_CATEGORY_LABELS: Record<HrDocumentCategory, string> = {
  RESUME: "Resume",
  OFFER_LETTER: "Offer letter",
  APPOINTMENT_LETTER: "Appointment letter",
  ID_PROOF: "Identity proof",
  ADDRESS_PROOF: "Address proof",
  EDUCATION: "Education certificate",
  EXPERIENCE: "Experience letter",
  POLICY: "Signed policy",
  OTHER: "Other",
};

export const HISTORY_EVENT_LABELS: Record<string, string> = {
  STATUS_CHANGE: "Status changed",
  DEPARTMENT_CHANGE: "Department changed",
  DESIGNATION_CHANGE: "Designation changed",
  MANAGER_CHANGE: "Reporting manager changed",
  JOINED: "Joined",
  TRANSFER: "Branch transfer",
};

// "2026-11-01T00:00:00.000Z" → "01 Nov 2026". Date-only fields are stored as
// UTC midnight, so format in UTC or they shift a day west of Greenwich.
export function formatHrDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

// ISO date → value for <input type="date">.
export function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export const TASK_OWNER_LABELS: Record<"HR" | "MANAGER" | "EMPLOYEE", string> = {
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};
