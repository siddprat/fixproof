import type { Photo, Urgency } from "../api/types";
import { api } from "../api/client";
import { urgencyLabel } from "../lib/labels";

export function UrgencyTag({ urgency }: { urgency: Urgency }) {
  return <span className={`tag tag--${urgency}`}>{urgencyLabel[urgency]}</span>;
}

/** eager: use on the printable report, so photos are loaded before window.print(). */
export function PhotoImg({ photo, alt, className, eager }: { photo: Photo; alt: string; className?: string; eager?: boolean }) {
  return <img src={api.photoSrc(photo)} alt={alt} className={className} loading={eager ? "eager" : "lazy"} decoding="async" />;
}
