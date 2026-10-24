// F6: app shell with skip link and landmarks.

import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api, USE_MOCK } from "../api/client";
import { copy } from "../copy";

/** Ask the api which mode it runs in, so the privacy line is always true. Defaults to hosted (the less private claim). */
function useAiMode(): "hosted" | "local" {
  const [mode, setMode] = useState<"hosted" | "local">("hosted");
  useEffect(() => {
    let live = true;
    api.health().then((h) => { if (live && h.mode === "local") setMode("local"); }).catch(() => { /* keep hosted */ });
    return () => { live = false; };
  }, []);
  return mode;
}

export function Layout() {
  const mode = useAiMode();
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="brand">FixProof</NavLink>
          <nav className="site-nav" aria-label="Main">
            <ul>
              <li><NavLink to="/" end>My log</NavLink></li>
              <li><NavLink to="/new">Add a problem</NavLink></li>
              <li><NavLink to="/email">Email</NavLink></li>
              <li><NavLink to="/report">Report</NavLink></li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <p>{mode === "local" ? copy.localHonesty : copy.hostedHonesty}</p>
          {USE_MOCK && <p><span className="mock-flag">Demo data. Nothing is uploaded.</span></p>}
        </div>
      </footer>
    </>
  );
}
