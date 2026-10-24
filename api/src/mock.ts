import type { Analysis } from './contract.js';

const hazard: Analysis = {
  "is_housing_problem": true,
  "visible_observations": [
    "A brown water stain about the size of a dinner plate on the bathroom ceiling",
    "Bubbled and peeling paint around the edge of the stain",
    "A light fixture is visible about 30 cm from the stain"
  ],
  "category": "plumbing",
  "location_in_unit": "bathroom ceiling",
  "urgency": "possible_hazard",
  "hazard_note": "Water staining near a light fixture. A professional should check it before the light is used.",
  "cannot_determine": [
    "Where the water is coming from",
    "Whether the leak is still active",
    "Whether the wiring above the ceiling is wet"
  ],
  "confidence": "medium",
  "suggested_alt_text": "Water-stained bathroom ceiling with peeling paint near a light fixture"
};

// Explicit test selectors only. Mock mode does not inspect photos.
export function mockAnalysis(note: string): Analysis {
  if (note.includes('[mock:unrelated]')) return {
    ...structuredClone(hazard), is_housing_problem: false,
    visible_observations: ['Mock result: an unrelated object.'], category: 'other',
    location_in_unit: null, urgency: 'routine', hazard_note: null,
    cannot_determine: ['This is a mock result, not an assessment of the uploaded photo.'],
    confidence: 'low', suggested_alt_text: 'Mock unrelated object',
  };
  if (note.includes('[mock:blurry]')) return {
    ...structuredClone(hazard), visible_observations: ['Mock result: the photo is too blurry to assess.'],
    category: 'other', location_in_unit: null, urgency: 'routine', hazard_note: null,
    cannot_determine: ['Details are not clear enough to assess.'], confidence: 'low',
    suggested_alt_text: 'Mock blurry photo',
  };
  return structuredClone(hazard);
}
