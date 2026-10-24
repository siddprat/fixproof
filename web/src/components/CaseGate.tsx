// Shows loading and error states while the case bootstraps, then renders the view.

import type { ReactNode } from "react";
import { useCase } from "../case/CaseContext";
import { errorMessage } from "../copy";

export function CaseGate({ children }: { children: ReactNode }) {
  const { status, error, retry } = useCase();

  if (status === "loading") {
    return <p role="status" aria-live="polite">Loading your log.</p>;
  }
  if (status === "error") {
    return (
      <div role="alert" className="notice notice--hazard">
        <p>{errorMessage(error)}</p>
        <button type="button" className="btn" onClick={retry}>Try again</button>
      </div>
    );
  }
  return <>{children}</>;
}
