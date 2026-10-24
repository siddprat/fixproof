// One h1 per view. Sets the document title and moves focus to the h1 after
// client-side navigation, so screen reader and keyboard users land on the new view.

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function Page({ title, heading, children }: { title: string; heading?: string; children: ReactNode }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} | FixProof`;
  }, [title]);

  useEffect(() => {
    // React Router gives the first page load the key "default". Leave focus alone
    // there so the skip link stays the first Tab stop; move it on every navigation after.
    if (location.key === "default") return;
    h1.current?.focus();
  }, [location.key]);

  return (
    <>
      <h1 ref={h1} tabIndex={-1}>{heading ?? title}</h1>
      {children}
    </>
  );
}
