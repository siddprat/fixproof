// F11: the log. Newest first. One primary action.

import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { PhotoImg, UrgencyTag } from "../components/bits";
import { DeleteCase } from "../components/DeleteCase";
import { useCase } from "../case/CaseContext";
import { copy } from "../copy";
import { formatDateTimeNY } from "../lib/format";
import { categoryLabel } from "../lib/labels";

export function LogView() {
  const { log } = useCase();
  const [deleted, setDeleted] = useState(false);
  const entries = [...(log?.entries ?? [])].reverse();
  const hasEntries = entries.length > 0;

  return (
    <Page title="My repair log">
      <p className="lede">{copy.tagline}</p>

      <div role="status" aria-live="polite">
        {deleted && <p className="notice notice--ok">Your case was deleted. This is a new, empty log.</p>}
      </div>

      <p>
        <Link to="/new" className="btn btn--primary btn--block-mobile">Add a problem</Link>
      </p>

      {hasEntries ? (
        <>
          <h2>Your problems, newest first</h2>
          <ul className="entry-list">
            {entries.map((e) => {
              const label = e.analysis.is_housing_problem ? categoryLabel[e.analysis.category] : "Not a housing problem";
              return (
                <li key={e.entryId} className="entry-item">
                  <Link to={`/entry/${e.entryId}`} className="entry-link">
                    <PhotoImg photo={e.photos[0]} alt={e.analysis.suggested_alt_text} className="thumb" />
                    <span className="entry-text">
                      <span className="entry-title">{label}</span>
                      <span className="muted">{formatDateTimeNY(e.createdAt)}</span>
                      {e.analysis.location_in_unit && <span className="muted">{e.analysis.location_in_unit}</span>}
                      {e.analysis.is_housing_problem && <span><UrgencyTag urgency={e.analysis.urgency} /></span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="muted">No problems yet. Add one and it shows up here with the date it was saved.</p>
      )}

      <nav aria-label="Case actions" className="case-actions">
        <h2 className="visually-hidden">Case actions</h2>
        <div className="row">
          {hasEntries && <Link to="/email" className="btn">Write an email</Link>}
          {hasEntries && <Link to="/report" className="btn">Print report</Link>}
          <DeleteCase onDeleted={() => setDeleted(true)} />
        </div>
      </nav>
    </Page>
  );
}
