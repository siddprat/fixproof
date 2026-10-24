import type { Photo, Urgency } from "../api/types";
import { api } from "../api/client";
import { urgencyLabel } from "../lib/labels";

export function UrgencyTag({ urgency }: { urgency: Urgency }) {
  return <span className={`tag tag--${urgency}`}>{urgencyLabel[urgency]}</span>;
}

export function PhotoImg({ photo, alt, className }: { photo: Photo; alt: string; className?: string }) {
  return <img src={api.photoSrc(photo)} alt={alt} className={className} loading="lazy" decoding="async" />;
}
