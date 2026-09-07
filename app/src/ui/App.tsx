import { ROLE_LABELS, can } from "@/domain/roles";
import { useApp, usePracticeState } from "./AppContext";
import { ClientDetailPage } from "./clients/ClientDetailPage";
import { ClientFormPage } from "./clients/ClientFormPage";
import { DuplicatesPage } from "./clients/DuplicatesPage";
import { Select } from "./components";
import { ImportPage } from "./import/ImportPage";
import { RosterPage } from "./roster/RosterPage";
import { hrefFor, useRoute, type Route } from "./router";

export function App() {
  const route = useRoute();
  const { currentUser, setCurrentUserId, store } = useApp();
  const state = usePracticeState();

  const isCurrent = (name: Route["name"]) =>
    route.name === name || (name === "roster" && (route.name === "client" || route.name === "client_edit" || route.name === "client_new"));

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="wordmark" href={hrefFor({ name: "roster" })}>
            Althio
          </a>
          <nav className="topnav" aria-label="Primary">
            <a href={hrefFor({ name: "roster" })} aria-current={isCurrent("roster") ? "page" : undefined}>
              Clients
            </a>
            {can(currentUser.role, "clients.merge") ? (
              <a href={hrefFor({ name: "duplicates" })} aria-current={isCurrent("duplicates") ? "page" : undefined}>
                Duplicates
              </a>
            ) : null}
            {can(currentUser.role, "clients.import") ? (
              <a href={hrefFor({ name: "import" })} aria-current={isCurrent("import") ? "page" : undefined}>
                Import
              </a>
            ) : null}
          </nav>
          <div className="identity">
            <label htmlFor="identity-select" className="identity-role">
              Signed in as
            </label>
            <Select id="identity-select" value={currentUser.id} onChange={(e) => setCurrentUserId(e.target.value)}>
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {ROLE_LABELS[user.role]}
                </option>
              ))}
            </Select>
            <button
              type="button"
              className="btn ghost small"
              title="Restore the demo dataset"
              onClick={() => {
                if (window.confirm("Replace all local data with the demo dataset?")) store.resetToSeed();
              }}
            >
              Reset demo
            </button>
          </div>
        </div>
      </header>
      <main>
        <RouteView route={route} />
      </main>
    </div>
  );
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case "roster":
      return <RosterPage presetId={route.preset} />;
    case "client_new":
      return <ClientFormPage />;
    case "client":
      return <ClientDetailPage key={route.id} id={route.id} mergeWith={route.mergeWith} />;
    case "client_edit":
      return <ClientFormPage key={route.id} clientId={route.id} />;
    case "duplicates":
      return <DuplicatesPage />;
    case "import":
      return <ImportPage />;
    case "not_found":
      return (
        <div className="page">
          <h1>Page not found</h1>
          <p className="muted">
            Nothing lives at <code>/{route.path}</code>.{" "}
            <a href={hrefFor({ name: "roster" })}>Back to clients</a>
          </p>
        </div>
      );
    default: {
      const exhaustive: never = route;
      return exhaustive;
    }
  }
}
