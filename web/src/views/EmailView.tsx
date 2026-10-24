import { Page } from "../components/Page";
import { copy } from "../copy";

// Placeholder. Email screen is F17.
export function EmailView() {
  return <Page title="Write an email"><p className="notice notice--info">{copy.emailNotice}</p></Page>;
}
