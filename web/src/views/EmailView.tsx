// F17: draft an email to the landlord. FixProof never sends it. The user copies it or opens their mail app.

import { useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Page } from "../components/Page";
import { UrgencyTag } from "../components/bits";
import { api } from "../api/client";
import { useCase } from "../case/CaseContext";
import { copy, emailErrorCopy, errorMessage } from "../copy";
import { formatDateTimeNY } from "../lib/format";
import { categoryLabel } from "../lib/labels";
import { DETAIL_KEYS, storageGet, storageSet } from "../lib/storage";

type EmailType = "first" | "followup";
const MAILTO_MAX = 1800; // Long mailto links get cut off by some mail apps and browsers.

export function EmailView() {
  const { caseId, log } = useCase();
  const [params] = useSearchParams();
  const id = useId();
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => [...(log?.entries ?? [])].reverse(), [log]); // newest first
  const usable = all.filter((e) => e.analysis.is_housing_problem);

  const [selected, setSelected] = useState<string[]>(() => {
    const wanted = params.get("entry");
    if (wanted && usable.some((e) => e.entryId === wanted)) return [wanted];
    return usable.map((e) => e.entryId);
  });
  const [type, setType] = useState<EmailType>(() => (usable.length > 1 ? "followup" : "first"));
  const [tenantName, setTenantName] = useState(() => storageGet(DETAIL_KEYS.tenantName) ?? "");
  const [landlordName, setLandlordName] = useState(() => storageGet(DETAIL_KEYS.landlordName) ?? "");
  const [unit, setUnit] = useState(() => storageGet(DETAIL_KEYS.unit) ?? "");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function toggle(entryId: string, on: boolean) {
    setSelected((prev) => (on ? [...prev, entryId] : prev.filter((x) => x !== entryId)));
    setFormError(null);
  }

  function remember(key: string, value: string) {
    storageSet(key, value.trim());
  }

  async function write(e: FormEvent) {
    e.preventDefault();
    if (!caseId) return;
    if (selected.length === 0) {
      setFormError("Pick at least one problem to write about.");
      document.getElementById(`${id}-first-entry`)?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    setCopied(null);
    try {
      // Send ids oldest first, the order the server lists them.
      const entryIds = [...usable].reverse().map((x) => x.entryId).filter((x) => selected.includes(x));
      const draft = await api.email(caseId, {
        entryIds,
        type,
        tenantName: tenantName.trim() || undefined,
        landlordName: landlordName.trim() || undefined,
        unit: unit.trim() || undefined,
      });
      setSubject(draft.subject);
      setBody(draft.body);
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (err) {
      setError(errorMessage(err, emailErrorCopy));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setBusy(false);
    }
  }

  async function copyEmail() {
    const text = `Subject: ${subject ?? ""}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Email copied. Paste it into your mail app.");
    } catch {
      // Clipboard API blocked: select the body so the user can copy it themselves.
      bodyRef.current?.focus();
      bodyRef.current?.select();
      setCopied("Copy did not work here. The email text is selected. Press Ctrl+C or Command+C, or long-press to copy.");
    }
  }

  const mailto = subject !== null
    ? `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : "";
  const mailtoTooLong = mailto.length > MAILTO_MAX;

  if (usable.length === 0) {
    return (
      <Page title="Write an email">
        <p className="notice notice--info">{copy.emailNotice}</p>
        <p>Add a problem first. Then come back here to write the email.</p>
        <p><Link to="/new" className="btn btn--primary">Add a problem</Link></p>
      </Page>
    );
  }

  return (
    <Page title="Write an email">
      <p className="notice notice--info"><strong>{copy.emailNotice}</strong></p>

      <form onSubmit={write} noValidate>
        <fieldset disabled={busy}>
          <fieldset aria-describedby={formError ? `${id}-sel-err` : undefined}>
            <legend>Which problems?</legend>
            {all.map((e, i) => {
              const ok = e.analysis.is_housing_problem;
              const firstOk = ok && usable[0]?.entryId === e.entryId;
              return (
                <label key={e.entryId} className="choice choice--hint">
                  <input
                    id={firstOk ? `${id}-first-entry` : undefined}
                    type="checkbox"
                    checked={selected.includes(e.entryId)}
                    disabled={!ok}
                    onChange={(ev) => toggle(e.entryId, ev.target.checked)}
                  />
                  <span>
                    <span className="choice-label">
                      {ok ? categoryLabel[e.analysis.category] : "Not a housing problem"}
                      {e.analysis.location_in_unit ? `, ${e.analysis.location_in_unit}` : ""}
                    </span>{" "}
                    <span className="muted">{formatDateTimeNY(e.createdAt)}</span>{" "}
                    {ok ? <UrgencyTag urgency={e.analysis.urgency} /> : <span className="muted">(can't be emailed)</span>}
                    <span className="visually-hidden">{i === 0 ? ", newest" : ""}</span>
                  </span>
                </label>
              );
            })}
            {formError && <p id={`${id}-sel-err`} className="field-error" role="alert">{formError}</p>}
          </fieldset>

          <fieldset>
            <legend>Is this the first time you're reporting it?</legend>
            <label className="choice">
              <input type="radio" name={`${id}-type`} checked={type === "first"} onChange={() => setType("first")} />
              First email
            </label>
            <label className="choice">
              <input type="radio" name={`${id}-type`} checked={type === "followup"} onChange={() => setType("followup")} />
              Follow-up, I reported it before
            </label>
          </fieldset>

          <h2>Your details (optional)</h2>
          <p className="hint">Saved only in this browser, so you don't have to type them again.</p>
          <div className="field">
            <label htmlFor={`${id}-tenant`}>Your name</label>
            <input id={`${id}-tenant`} type="text" autoComplete="name" value={tenantName}
              onChange={(e) => setTenantName(e.target.value)} onBlur={(e) => remember(DETAIL_KEYS.tenantName, e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-landlord`}>Landlord or manager's name</label>
            <input id={`${id}-landlord`} type="text" value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)} onBlur={(e) => remember(DETAIL_KEYS.landlordName, e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-unit`}>Unit or apartment number</label>
            <input id={`${id}-unit`} type="text" value={unit}
              onChange={(e) => setUnit(e.target.value)} onBlur={(e) => remember(DETAIL_KEYS.unit, e.target.value)} />
          </div>

          <button type="submit" className={`btn btn--block${subject === null ? " btn--primary" : ""}`}>
            {subject === null ? "Write the email" : "Write it again"}
          </button>
        </fieldset>
      </form>

      <div role="status" aria-live="polite">
        {busy && <p className="notice notice--info"><span className="spinner" aria-hidden="true" /> Writing your email. This takes a few seconds.</p>}
      </div>
      {error && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="notice notice--hazard"><p>{error}</p></div>
      )}

      {subject !== null && (
        <section aria-labelledby={`${id}-result`} className="card email-result">
          <h2 id={`${id}-result`} ref={resultHeading} tabIndex={-1}>Your email</h2>
          <p className="notice notice--info">{copy.aiNotice}</p>
          <div className="field">
            <label htmlFor={`${id}-subject`}>Subject</label>
            <input id={`${id}-subject`} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-body`}>Message</label>
            <textarea id={`${id}-body`} ref={bodyRef} value={body} rows={14} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={copyEmail}>Copy email</button>
            <a className="btn" href={mailto}>Open in my mail app</a>
          </div>
          {mailtoTooLong && (
            <p className="hint">This email is long. Some mail apps cut it off. If that happens, use Copy email instead.</p>
          )}
          <div role="status" aria-live="polite">{copied && <p className="notice notice--ok save-ok">{copied}</p>}</div>
          <p><strong>{copy.emailNotice}</strong></p>
        </section>
      )}
    </Page>
  );
}
