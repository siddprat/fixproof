import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { useCase } from "../case/CaseContext";
import { copy } from "../copy";
import { formatDateTimeNY } from "../lib/format";

// Phase 0: proves the case bootstrap and log fetch. Full screen is F11.
export function LogView() {
  const { log } = useCase();
  const entries = [...(log?.entries ?? [])].reverse(); // newest first

  return (
    <Page title="My repair log">
      <p className="lede">{copy.tagline}</p>
      {entries.length === 0 ? (
        <p><Link to="/new" className="btn btn--primary">Add a problem</Link></p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e.entryId}>
              <Link to={`/entry/${e.entryId}`}>{e.analysis.category}</Link>, {formatDateTimeNY(e.createdAt)}, {e.analysis.urgency}
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
