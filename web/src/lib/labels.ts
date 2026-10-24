import type { Category, Urgency } from "../api/types";

export const categoryLabel: Record<Category, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  mold_moisture: "Mold or moisture",
  appliance: "Appliance",
  pests: "Pests",
  structure: "Walls, floors, or doors",
  heating_cooling: "Heating or cooling",
  other: "Other",
};

export const urgencyLabel: Record<Urgency, string> = {
  routine: "Routine",
  soon: "Fix soon",
  possible_hazard: "Possible hazard",
};

export const urgencyHint: Record<Urgency, string> = {
  routine: "Annoying, but not getting worse fast.",
  soon: "Getting worse or makes the unit harder to live in.",
  possible_hazard: "Could hurt someone or damage the unit.",
};

export const CATEGORIES = Object.keys(categoryLabel) as Category[];
export const URGENCIES = Object.keys(urgencyLabel) as Urgency[];
