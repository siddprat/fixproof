// Copy deck from TODO_FRIEND.md. Use these strings so the app sounds like one voice.
// Plain words, short sentences, no em dashes.

import type { ClientErrorCode } from "./api/client";

export const copy = {
  tagline: "Take a photo of a repair problem. We write it up and keep the record.",
  aiNotice: "AI draft. Check every field before you use it.",
  analyzing: "Looking at your photos. This takes a few seconds.",
  hazard: "This may be urgent. If anyone is in immediate danger, call 911. Otherwise, contact your landlord's emergency maintenance line now.",
  lowConfidence: "This photo isn't clear enough. Try again with more light, closer to the problem.",
  notHousing: "This doesn't look like a housing problem. Try a photo of the issue itself.",
  emailNotice: "Read it before you send it. FixProof never sends anything for you.",
  deleteConfirm: "This deletes every photo and note. It cannot be undone.",
  hostedHonesty: "Photos are sent to Google's Gemini service to be read. Delete your case any time.",
  // Not in the copy deck. Only shown when /api/health reports mode "local". Storage is still Google Cloud.
  localHonesty: "Photos are read by a model on our own server, not sent to Gemini. They are stored in Google Cloud. Delete your case any time.",
} as const;

export const errorCopy: Record<ClientErrorCode, string> = {
  AI_UNAVAILABLE: "We couldn't reach the photo reader. Your photos were not saved. Try again.",
  AI_INVALID_OUTPUT: "We couldn't read this photo reliably. Try a clearer photo.",
  PAYLOAD_TOO_LARGE: "That photo is too big. Try a smaller one.",
  TOO_MANY_REQUESTS: "Lots of requests right now. Wait a minute and try again.",
  NOT_FOUND: "We can't find that. It may have been deleted.",
  BAD_REQUEST: "Something was missing. Check the photo and try again.",
  // Not in the copy deck: client-only, for when the phone has no signal.
  NETWORK: "We couldn't connect. Check your internet and try again.",
};

/** The copy deck's AI errors talk about photos. On the email screen they need different words. */
export const emailErrorCopy: Partial<Record<ClientErrorCode, string>> = {
  AI_UNAVAILABLE: "We couldn't reach the email writer. Nothing was sent. Try again.",
  AI_INVALID_OUTPUT: "We couldn't write a reliable email this time. Try again.",
};

export function errorMessage(err: unknown, overrides: Partial<Record<ClientErrorCode, string>> = {}): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code as ClientErrorCode;
    if (overrides[code]) return overrides[code];
    if (code in errorCopy) return errorCopy[code];
  }
  return "Something went wrong. Try again.";
}
