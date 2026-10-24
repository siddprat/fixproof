import { Link, useParams } from "react-router-dom";
import { Page } from "../components/Page";
import { useCase } from "../case/CaseContext";
import { copy, errorCopy } from "../copy";

// Placeholder. Analysis screen is F14 to F16.
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
  return (
    <Page title="Check the write-up">
      <p className="notice notice--info">{copy.aiNotice}</p>
      <p>The analysis screen comes next.</p>
    </Page>
  );
}
