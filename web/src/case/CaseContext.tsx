// F7: case bootstrap. On first load, create a case if none is stored, then load its log.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiClientError } from "../api/client";
import type { CaseLog } from "../api/types";
import { CASE_KEY, storageGet, storageRemove, storageSet } from "../lib/storage";

type Status = "loading" | "ready" | "error";

interface CaseState {
  status: Status;
  caseId: string | null;
  log: CaseLog | null;
  error: unknown;
  /** Re-fetch the log from the server. */
  refresh: () => Promise<void>;
  /** Forget the current case and start a new one (used after delete). */
  startFresh: () => Promise<void>;
  /** Retry the whole bootstrap after an error. */
  retry: () => void;
}

const CaseContext = createContext<CaseState | null>(null);

async function createAndStore(): Promise<string> {
  const { caseId } = await api.createCase();
  storageSet(CASE_KEY, caseId);
  return caseId;
}

export function CaseProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [log, setLog] = useState<CaseLog | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    // Guard against React StrictMode running the effect twice and creating two cases.
    if (started.current === attempt) return;
    started.current = attempt;

    (async () => {
      setStatus("loading");
      try {
        let id = storageGet(CASE_KEY) ?? (await createAndStore());
        let loaded: CaseLog;
        try {
          loaded = await api.getCase(id);
        } catch (err) {
          // Stored id points at a case that no longer exists: start a new one.
          if (err instanceof ApiClientError && err.code === "NOT_FOUND") {
            id = await createAndStore();
            loaded = await api.getCase(id);
          } else {
            throw err;
          }
        }
        setCaseId(id);
        setLog(loaded);
        setStatus("ready");
      } catch (err) {
        setError(err);
        setStatus("error");
      }
    })();
  }, [attempt]);

  const refresh = useCallback(async () => {
    if (!caseId) return;
    setLog(await api.getCase(caseId));
  }, [caseId]);

  const startFresh = useCallback(async () => {
    storageRemove(CASE_KEY);
    const id = await createAndStore();
    setCaseId(id);
    setLog(await api.getCase(id));
    setStatus("ready");
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(
    () => ({ status, caseId, log, error, refresh, startFresh, retry }),
    [status, caseId, log, error, refresh, startFresh, retry],
  );
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase(): CaseState {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used inside CaseProvider");
  return ctx;
}
