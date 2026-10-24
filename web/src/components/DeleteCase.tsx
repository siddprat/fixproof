// F19: delete my case, with a native <dialog> for the confirmation.
// showModal() gives us focus trapping, Escape to close, and an inert background for free.

import { useRef, useState } from "react";
import { api } from "../api/client";
import { useCase } from "../case/CaseContext";
import { copy, errorMessage } from "../copy";

export function DeleteCase({ onDeleted }: { onDeleted: () => void }) {
  const { caseId, startFresh } = useCase();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => { setError(null); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); };

  async function confirm() {
    if (!caseId) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteCase(caseId);
      await startFresh();
      dialog.current?.close();
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button ref={opener} type="button" className="btn btn--danger" onClick={open}>Delete my case</button>
      <dialog
        ref={dialog}
        className="dialog"
        aria-labelledby="delete-title"
        aria-describedby="delete-desc"
        onClose={() => opener.current?.focus()}
      >
        <h2 id="delete-title">Delete your case?</h2>
        <p id="delete-desc">{copy.deleteConfirm}</p>
        {error && <p role="alert" className="field-error">{error}</p>}
        {busy && <p role="status">Deleting.</p>}
        <div className="row">
          {/* Cancel first so a quick Enter does not delete anything. */}
          <button type="button" className="btn" onClick={close} disabled={busy} autoFocus>Cancel</button>
          <button type="button" className="btn btn--danger" onClick={confirm} disabled={busy}>
            Delete everything
          </button>
        </div>
      </dialog>
    </>
  );
}
