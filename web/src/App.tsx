import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CaseGate } from "./components/CaseGate";
import { LogView } from "./views/LogView";
import { NewView } from "./views/NewView";
import { EntryView } from "./views/EntryView";
import { EmailView } from "./views/EmailView";
import { ReportView } from "./views/ReportView";
import { NotFoundView } from "./views/NotFoundView";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CaseGate><LogView /></CaseGate>} />
        <Route path="new" element={<CaseGate><NewView /></CaseGate>} />
        <Route path="entry/:entryId" element={<CaseGate><EntryView /></CaseGate>} />
        <Route path="email" element={<CaseGate><EmailView /></CaseGate>} />
        <Route path="report" element={<CaseGate><ReportView /></CaseGate>} />
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  );
}
