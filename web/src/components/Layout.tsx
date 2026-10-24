// F6: app shell with skip link and landmarks.

import { NavLink, Outlet } from "react-router-dom";
import { USE_MOCK } from "../api/client";
import { copy } from "../copy";

export function Layout() {
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
          <p>{copy.hostedHonesty}</p>
          {USE_MOCK && <p><span className="mock-flag">Demo data. Nothing is uploaded.</span></p>}
        </div>
      </footer>
    </>
  );
}
