import type { Analysis, Entry } from "./types";

// Fixture data for the in-browser mock. Every object here must satisfy the
// types in AGENTS.md. `satisfies` makes the compiler check that for us.

export const FIXTURE_CASE_ID = "2f4c6a52-3e44-4a0b-9d0c-7a1e5d0f3c11";

/** The hazard example, copied from AGENTS.md "Example Entry". */
export const hazardEntry = {
  entryId: "7b0f0e0e-9c58-4a65-8d34-0d2c3a1b9f10",
  caseId: "2f4c6a52-3e44-4a0b-9d0c-7a1e5d0f3c11",
  createdAt: "2026-10-24T21:14:05.123Z",
  note: "Bathroom ceiling, started dripping Tuesday",
  photos: [
    {
      photoId: "c1a9b6d2-1b6f-4d5a-8e0b-6a9c3f2d1e07",
      sha256: "9f2c1d0a7b6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a",
      url: "/api/cases/2f4c6a52-3e44-4a0b-9d0c-7a1e5d0f3c11/photos/c1a9b6d2-1b6f-4d5a-8e0b-6a9c3f2d1e07",
      exifTime: "2026-10-24T21:12:40.000Z",
    },
  ],
  analysis: {
    is_housing_problem: true,
    visible_observations: [
      "A brown water stain about the size of a dinner plate on the bathroom ceiling",
      "Bubbled and peeling paint around the edge of the stain",
      "A light fixture is visible about 30 cm from the stain",
    ],
    category: "plumbing",
    location_in_unit: "bathroom ceiling",
    urgency: "possible_hazard",
    hazard_note: "Water staining near a light fixture. A professional should check it before the light is used.",
    cannot_determine: [
      "Where the water is coming from",
      "Whether the leak is still active",
      "Whether the wiring above the ceiling is wet",
    ],
    confidence: "medium",
    suggested_alt_text: "Water-stained bathroom ceiling with peeling paint near a light fixture",
  },
  edited: false,
} satisfies Entry;

export const routineEntry = {
  entryId: "3d8e5a41-6f2b-4c7e-9a10-2b4d6f8a0c21",
  caseId: FIXTURE_CASE_ID,
  createdAt: "2026-10-17T14:02:11.480Z",
  note: "Kitchen tap drips all night",
  photos: [
    {
      photoId: "a4e7c2b9-8d1f-4e6a-b3c5-9f0d2e4a6b81",
      sha256: "1b3d5f7a9c0e2a4c6e8a0b2d4f6a8c0e1a3c5e7a9b1d3f5a7c9e0b2d4f6a8c0e",
      url: "/api/cases/2f4c6a52-3e44-4a0b-9d0c-7a1e5d0f3c11/photos/a4e7c2b9-8d1f-4e6a-b3c5-9f0d2e4a6b81",
      exifTime: null,
    },
  ],
  analysis: {
    is_housing_problem: true,
    visible_observations: [
      "A drop of water is forming at the tip of the kitchen faucet",
      "Light mineral buildup around the base of the faucet",
    ],
    category: "plumbing",
    location_in_unit: "kitchen sink",
    urgency: "routine",
    hazard_note: null,
    cannot_determine: [
      "How fast the faucet drips",
      "Whether the drip is from the hot or cold side",
    ],
    confidence: "high",
    suggested_alt_text: "Kitchen faucet with a water drop at the tip",
  },
  edited: false,
} satisfies Entry;

export const lowConfidenceEntry = {
  entryId: "9a2c4e6f-1b3d-4f5a-8c7e-0d2f4a6c8e13",
  caseId: FIXTURE_CASE_ID,
  createdAt: "2026-10-20T01:45:30.002Z",
  note: "",
  photos: [
    {
      photoId: "e5b7d9f1-3a5c-4e7b-9d1f-3b5d7f9a1c35",
      sha256: "7c9e1a3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c",
      url: "/api/cases/2f4c6a52-3e44-4a0b-9d0c-7a1e5d0f3c11/photos/e5b7d9f1-3a5c-4e7b-9d1f-3b5d7f9a1c35",
      exifTime: "2026-10-20T01:44:58.000Z",
    },
  ],
  analysis: {
    is_housing_problem: true,
    visible_observations: [
      "A dark area near the bottom of a wall",
    ],
    category: "other",
    location_in_unit: null,
    urgency: "routine",
    hazard_note: null,
    cannot_determine: [
      "What the dark area is",
      "Which room this is",
      "How large the area is",
    ],
    confidence: "low",
    suggested_alt_text: "Dark, blurry photo of the lower part of a wall",
  },
  edited: false,
} satisfies Entry;

export const notHousingEntry = {
  entryId: "5f7a9c1e-3b5d-4a7f-9b1d-5f7a9c1e3b57",
  caseId: FIXTURE_CASE_ID,
  createdAt: "2026-10-22T18:30:00.750Z",
  note: "",
  photos: [
    {
      photoId: "b2d4f6a8-0c2e-4a6c-8e0a-2c4e6a8c0e29",
      sha256: "3e5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a",
      url: "/api/cases/2f4c6a52-3e44-4a0b-9d0c-7a1e5d0f3c11/photos/b2d4f6a8-0c2e-4a6c-8e0a-2c4e6a8c0e29",
      exifTime: null,
    },
  ],
  analysis: {
    is_housing_problem: false,
    visible_observations: [
      "A dog lying on a couch",
    ],
    category: "other",
    location_in_unit: null,
    urgency: "routine",
    hazard_note: null,
    cannot_determine: [
      "Whether there is a repair problem in this photo",
    ],
    confidence: "low",
    suggested_alt_text: "A dog lying on a couch",
  },
  edited: false,
} satisfies Entry;

/** Seed entries, oldest first (the order GET /api/cases/:caseId returns). */
export const seedEntries: Entry[] = [routineEntry, lowConfidenceEntry, notHousingEntry, hazardEntry];

/** Analyses the mock hands out, in rotation, when a new entry is uploaded. */
export const analysisRotation: Analysis[] = [
  hazardEntry.analysis,
  routineEntry.analysis,
  lowConfidenceEntry.analysis,
  notHousingEntry.analysis,
];

/** Simple placeholder art for fixture photos, so the mock needs no image files. */
export const fixtureArt: Record<string, { label: string; bg: string; fg: string }> = {
  [hazardEntry.photos[0].photoId]: { label: "Ceiling stain", bg: "#d9cbb8", fg: "#6b4a2b" },
  [routineEntry.photos[0].photoId]: { label: "Dripping tap", bg: "#c9d8e3", fg: "#28465c" },
  [lowConfidenceEntry.photos[0].photoId]: { label: "Too dark", bg: "#3b3f45", fg: "#c9ccd1" },
  [notHousingEntry.photos[0].photoId]: { label: "Dog on couch", bg: "#e3d9c9", fg: "#4d3b22" },
};
