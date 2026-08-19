export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  goal_minutes: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  contact_reference: string;
  default_role: string;
  details: string;
  created_at: string;
  updated_at: string;
};

export type ExperienceEntry = {
  id: string;
  user_id: string;
  category_id: string;
  organization_id: string | null;
  entry_date: string | null;
  session_notes: string;
  organization_name_snapshot: string;
  role_activity: string;
  minutes: number;
  contact_snapshot: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  full_name: string;
  username: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalData = {
  categories: Category[];
  organizations: Organization[];
  entries: ExperienceEntry[];
};

export type EntryDraft = {
  id?: string;
  categoryId: string;
  organizationId: string;
  entryDate: string;
  sessionNotes: string;
  organizationName: string;
  roleActivity: string;
  durationMinutes: number;
  contactReference: string;
};

export type ProfileDraft = {
  fullName: string;
  username: string;
  avatarFile: File | null;
  removeAvatar: boolean;
};

export type OrganizationDraft = {
  id?: string;
  categoryId: string;
  name: string;
  contactReference: string;
  defaultRole: string;
  details: string;
};

export const CATEGORY_COLORS = [
  "#b3538c",
  "#7763b2",
  "#d19a3e",
  "#337f6d",
  "#a65a4f",
  "#4f78a8",
  "#7d5a9e",
  "#667239",
];

export function splitDuration(totalMinutes: number) {
  const normalizedMinutes = Math.max(0, Math.floor(totalMinutes));
  return {
    hours: Math.floor(normalizedMinutes / 60),
    minutes: normalizedMinutes % 60,
  };
}

export function parseDurationParts(hours: string, minutes: string) {
  const parsedHours = Number(hours || "0");
  const parsedMinutes = Number(minutes || "0");

  if (
    !Number.isInteger(parsedHours) ||
    parsedHours < 0 ||
    !Number.isInteger(parsedMinutes) ||
    parsedMinutes < 0 ||
    parsedMinutes > 59
  ) {
    return null;
  }

  return parsedHours * 60 + parsedMinutes;
}

export function formatDuration(totalMinutes: number) {
  const { hours, minutes } = splitDuration(totalMinutes);
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours.toLocaleString()} ${hours === 1 ? "hr" : "hrs"}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "min" : "mins"}`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 hrs";
}

export function formatDisplayDate(date: string | null) {
  if (!date) return "No date";
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
