import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { errorCopy } from "../copy";

export function NotFoundView() {
  return (
    <Page title="Page not found">
      <p>{errorCopy.NOT_FOUND}</p>
      <p><Link to="/">Back to my log</Link></p>
    </Page>
  );
}
