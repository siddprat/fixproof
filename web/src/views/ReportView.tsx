// F18 + F20: print-ready chronological report with photo fingerprints and a per-photo check.
// Language rule: "timestamped and verifiable". Never claim legal weight.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { PhotoImg } from "../components/bits";
import { api } from "../api/client";
import type { Entry } from "../api/types";
import { useCase } from "../case/CaseContext";
import { formatDateTimeNY } from "../lib/format";
import { categoryLabel, urgencyLabel } from "../lib/labels";

type Check = "checking" | "ok" | "changed" | "unknown";

function useVerify(caseId: string | null, count: number) {
  const [checks, setChecks] = useState<Record<string, boolean> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!caseId || count === 0) return;
    let live = true;
    setChecks(null);
    setFailed(false);
    api.verify(caseId)
      .then(({ results }) => { if (live) setChecks(Object.fromEntries(results.map((r) => [r.photoId, r.ok]))); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [caseId, count]);

  const status = (photoId: string): Check => {
    if (failed) return "unknown";
    if (!checks) return "checking";
    if (!(photoId in checks)) return "unknown";
    return checks[photoId] ? "ok" : "changed";
  };
  return { status, failed, done: checks !== null || failed };
}

const checkText: Record<Check, string> = {
  checking: "Checking the fingerprint.",
  ok: "Unchanged since saved",
  changed: "Changed, do not trust this photo",
  unknown: "Could not check right now",
};

export function ReportView() {
  const { caseId, log } = useCase();
  const entries = log?.entries.filter((e) => e.analysis.is_housing_problem) ?? []; // oldest first
  const skipped = (log?.entries.length ?? 0) - entries.length;
  const photoCount = entries.reduce((n, e) => n + e.photos.length, 0);
  const verify = useVerify(caseId, photoCount);
  const [generatedAt] = useState(() => new Date().toISOString());

  if (entries.length === 0) {
    return (
      <Page title="Repair report">
        <p>There is nothing to report yet. Add a problem and it shows up here.</p>
        <p><Link to="/new" className="btn btn--primary">Add a problem</Link></p>
      </Page>
    );
  }

  return (
    <Page title="Repair report">
      <div className="report-head">
        <p>Generated {formatDateTimeNY(generatedAt)} Eastern. Made with FixProof.</p>
        <p>
          {entries.length} {entries.length === 1 ? "problem" : "problems"}, oldest first.
          {skipped > 0 && ` ${skipped} ${skipped === 1 ? "photo that did not" : "photos that did not"} show a housing problem ${skipped === 1 ? "is" : "are"} left out.`}
        </p>
      </div>

      <div className="row no-print">
        <button type="button" className="btn btn--primary" onClick={() => window.print()}>Print or save as PDF</button>
        <Link to="/" className="btn">Back to my log</Link>
      </div>
      <div role="status" aria-live="polite" className="no-print">
        {verify.done && (verify.failed
          ? <p className="muted">We could not check the photo fingerprints right now. The codes below are still the saved ones.</p>
          : <p className="muted">Photo fingerprints checked.</p>)}
      </div>

      <ol className="report-list">
        {entries.map((e, i) => <ReportEntry key={e.entryId} entry={e} index={i} status={verify.status} />)}
      </ol>

      <footer className="report-foot">
        <h2>About the codes</h2>
        <p>
          The code above is a fingerprint of each photo. If the photo changes, the code changes.
          It shows the file has not been altered since it was saved. It does not prove what the photo shows.
        </p>
        <p>
          "Recorded at" is the time our server saved the entry. "Camera time" comes from the photo file
          and was not verified.
        </p>
      </footer>
    </Page>
  );
}

function ReportEntry({ entry, index, status }: { entry: Entry; index: number; status: (id: string) => Check }) {
  const a = entry.analysis;
  return (
    <li className="card report-entry">
      <h2>{index + 1}. {categoryLabel[a.category]}{a.location_in_unit ? `, ${a.location_in_unit}` : ""}</h2>
      <dl className="facts">
        <dt>Recorded at</dt>
        <dd>{formatDateTimeNY(entry.createdAt)} Eastern <span className="muted">({entry.createdAt})</span></dd>
        <dt>Type</dt><dd>{categoryLabel[a.category]}</dd>
        <dt>Location</dt><dd>{a.location_in_unit ?? "Not given"}</dd>
        <dt>Urgency</dt><dd>{urgencyLabel[a.urgency]}</dd>
        {entry.note && (<><dt>Tenant note</dt><dd>{entry.note}</dd></>)}
        <dt>Written by</dt><dd>{entry.edited ? "AI draft, checked and edited by the tenant" : "AI draft"}</dd>
      </dl>

      <h3>What the photos show</h3>
      <ul>{a.visible_observations.map((o) => <li key={o}>{o}</li>)}</ul>

      {entry.photos.map((p, i) => {
        const s = status(p.photoId);
        return (
          <figure key={p.photoId} className="report-photo">
            <PhotoImg eager photo={p} alt={entry.photos.length > 1 ? `${a.suggested_alt_text} (photo ${i + 1} of ${entry.photos.length})` : a.suggested_alt_text} />
            <figcaption>
              <p className="report-photo-title">Photo {i + 1} of {entry.photos.length}</p>
              {p.exifTime && <p>Camera time (not verified): {formatDateTimeNY(p.exifTime)} Eastern</p>}
              <p className="label">Fingerprint (SHA-256)</p>
              <p className="hash">{p.sha256}</p>
              <p className={`check check--${s}`}>
                <span aria-hidden="true">{s === "ok" ? "✓ " : s === "changed" ? "✗ " : ""}</span>{checkText[s]}
              </p>
            </figcaption>
          </figure>
        );
      })}
    </li>
  );
}
