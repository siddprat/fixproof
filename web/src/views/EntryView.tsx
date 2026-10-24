// F14 + F15 + F16: the AI draft, fully editable, with hazard and low-confidence handling.

import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Page } from "../components/Page";
import { PhotoImg, UrgencyTag } from "../components/bits";
import { api } from "../api/client";
import type { Category, Entry, Urgency } from "../api/types";
import { useCase } from "../case/CaseContext";
import { copy, errorCopy, errorMessage } from "../copy";
import { formatDateTimeNY } from "../lib/format";
import { CATEGORIES, URGENCIES, categoryLabel, urgencyHint, urgencyLabel } from "../lib/labels";

interface Draft {
  observations: string;
  category: Category;
  location: string;
  urgency: Urgency;
  altText: string;
  note: string;
}

function toDraft(e: Entry): Draft {
  return {
    observations: e.analysis.visible_observations.join("\n"),
    category: e.analysis.category,
    location: e.analysis.location_in_unit ?? "",
    urgency: e.analysis.urgency,
    altText: e.analysis.suggested_alt_text,
    note: e.note,
  };
}

export function EntryView() {
  const { entryId } = useParams();
  const { log } = useCase();
  const entry = log?.entries.find((e) => e.entryId === entryId);

  if (!entry) {
    return (
      <Page title="Not found">
        <p>{errorCopy.NOT_FOUND}</p>
        <p><Link to="/">Back to my log</Link></p>
      </Page>
    );
  }
  // Keyed so the form resets when moving between entries.
  return <EntryScreen key={entry.entryId} entry={entry} />;
}

function EntryScreen({ entry }: { entry: Entry }) {
  const { caseId, upsertEntry } = useCase();
  const id = useId();
  const [draft, setDraft] = useState<Draft>(() => toDraft(entry));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [obsError, setObsError] = useState<string | null>(null);

  const a = entry.analysis;
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(entry));
  useEffect(() => { if (dirty) setSaved(false); }, [dirty]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!caseId) return;
    const observations = draft.observations.split("\n").map((s) => s.trim()).filter(Boolean);
    if (observations.length === 0) {
      setObsError("Add at least one thing you can see in the photo.");
      document.getElementById(`${id}-obs`)?.focus();
      return;
    }
    setObsError(null);
    setSaving(true);
    setError(null);
    try {
      const { entry: updated } = await api.patchEntry(caseId, entry.entryId, {
        note: draft.note,
        analysis: {
          visible_observations: observations,
          category: draft.category,
          location_in_unit: draft.location.trim() || null,
          urgency: draft.urgency,
          suggested_alt_text: draft.altText.trim() || a.suggested_alt_text,
        },
      });
      upsertEntry(updated);
      setDraft(toDraft(updated));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const photoAlt = (i: number) =>
    entry.photos.length > 1 ? `${a.suggested_alt_text} (photo ${i + 1} of ${entry.photos.length})` : a.suggested_alt_text;

  return (
    <Page title={a.is_housing_problem ? "Check the write-up" : "Not a housing problem"}>
      {a.is_housing_problem && a.urgency === "possible_hazard" && (
        <div role="alert" className="notice notice--hazard">
          <p><strong>{copy.hazard}</strong></p>
          {a.hazard_note && <p>{a.hazard_note}</p>}
        </div>
      )}

      <p className="muted">
        Saved {formatDateTimeNY(entry.createdAt)}
        {entry.edited && " · Edited by you"}
      </p>

      <ul className="photo-grid" aria-label="Photos">
        {entry.photos.map((p, i) => (
          <li key={p.photoId}><PhotoImg photo={p} alt={photoAlt(i)} /></li>
        ))}
      </ul>

      {!a.is_housing_problem ? (
        <div className="notice notice--warn">
          <p>{copy.notHousing}</p>
          <div className="row">
            <Link to="/new" className="btn">Try another photo</Link>
            <Link to="/" className="btn">Back to my log</Link>
          </div>
        </div>
      ) : (
        <>
          {a.confidence === "low" && (
            <div className="notice notice--warn">
              <h2 className="notice-title">This photo isn't clear enough</h2>
              <p>{copy.lowConfidence}</p>
              <Link to="/new" className="btn">Retake the photo</Link>
            </div>
          )}

          <p className="notice notice--info"><strong>{copy.aiNotice}</strong></p>

          <form onSubmit={save} noValidate>
            <div className="field">
              <label htmlFor={`${id}-obs`}>What the photo shows</label>
              <span className="hint" id={`${id}-obs-hint`}>One thing per line. Describe only what you can see.</span>
              <textarea
                id={`${id}-obs`}
                value={draft.observations}
                onChange={(e) => set("observations", e.target.value)}
                aria-describedby={`${id}-obs-hint${obsError ? ` ${id}-obs-err` : ""}`}
                aria-invalid={obsError ? true : undefined}
                rows={Math.max(4, draft.observations.split("\n").reduce((n, l) => n + Math.ceil((l.length || 1) / 32), 1))}
              />
              {obsError && <p id={`${id}-obs-err`} className="field-error">{obsError}</p>}
            </div>

            <div className="field">
              <label htmlFor={`${id}-cat`}>Type of problem</label>
              <select id={`${id}-cat`} value={draft.category} onChange={(e) => set("category", e.target.value as Category)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor={`${id}-loc`}>Where in your unit</label>
              <span className="hint" id={`${id}-loc-hint`}>For example: bathroom ceiling.</span>
              <input
                id={`${id}-loc`} type="text" value={draft.location}
                onChange={(e) => set("location", e.target.value)} aria-describedby={`${id}-loc-hint`}
              />
            </div>

            <fieldset>
              <legend>How urgent is it?</legend>
              {URGENCIES.map((u) => (
                <label key={u} className="choice choice--hint">
                  <input type="radio" name={`${id}-urg`} value={u} checked={draft.urgency === u} onChange={() => set("urgency", u)} />
                  <span><span className="choice-label">{urgencyLabel[u]}</span> <span className="muted">{urgencyHint[u]}</span></span>
                </label>
              ))}
            </fieldset>

            <div className="field">
              <label htmlFor={`${id}-note`}>Your note</label>
              <textarea id={`${id}-note`} value={draft.note} maxLength={1000} rows={3} onChange={(e) => set("note", e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor={`${id}-alt`}>Photo description</label>
              <span className="hint" id={`${id}-alt-hint`}>Read aloud by screen readers. Short and plain.</span>
              <input
                id={`${id}-alt`} type="text" value={draft.altText}
                onChange={(e) => set("altText", e.target.value)} aria-describedby={`${id}-alt-hint`}
              />
            </div>

            <div className="row">
              <button type="submit" className="btn btn--primary" disabled={saving || !dirty}>
                {saving ? "Saving" : "Save changes"}
              </button>
              {dirty && !saving && <span className="muted">You have unsaved changes.</span>}
            </div>
            <div role="status" aria-live="polite">
              {saved && !dirty && <p className="notice notice--ok save-ok">Saved.</p>}
            </div>
            {error && <p role="alert" className="notice notice--hazard">{error}</p>}
          </form>

          <h2>What the photo can't tell us</h2>
          {a.cannot_determine.length > 0 ? (
            <ul>{a.cannot_determine.map((c) => <li key={c}>{c}</li>)}</ul>
          ) : (
            <p className="muted">Nothing listed.</p>
          )}
          <p className="muted">Current label: <UrgencyTag urgency={a.urgency} /> {categoryLabel[a.category]}</p>
        </>
      )}

      <div className="row case-actions">
        {a.is_housing_problem ? (
          <Link to={`/email?entry=${entry.entryId}`} className="btn btn--primary">Write an email about this</Link>
        ) : (
          <button type="button" className="btn" disabled aria-describedby={`${id}-noemail`}>Write an email about this</button>
        )}
        <Link to="/" className="btn">Back to my log</Link>
      </div>
      {!a.is_housing_problem && <p id={`${id}-noemail`} className="hint">Email is off for photos that don't show a housing problem.</p>}
    </Page>
  );
}
