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

export function errorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code as ClientErrorCode;
    if (code in errorCopy) return errorCopy[code];
  }
  return "Something went wrong. Try again.";
}
