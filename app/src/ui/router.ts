import { useCallback, useEffect, useState } from "react";

export type Route =
  | { name: "roster"; preset?: string }
  | { name: "client_new" }
  | { name: "client"; id: string; mergeWith?: string }
  | { name: "client_edit"; id: string }
  | { name: "duplicates" }
  | { name: "import" }
  | { name: "not_found"; path: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/^\/+/, "");
  const [pathname = "", query = ""] = path.split("?");
  const parts = pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(query);

  if (parts.length === 0 || parts[0] === "clients") {
    if (parts.length <= 1) {
      const preset = params.get("preset");
      return preset ? { name: "roster", preset } : { name: "roster" };
    }
    if (parts[1] === "new") return { name: "client_new" };
    const id = decodeURIComponent(parts[1] ?? "");
    if (parts[2] === "edit") return { name: "client_edit", id };
    const mergeWith = params.get("merge");
    return mergeWith ? { name: "client", id, mergeWith } : { name: "client", id };
  }
  if (parts[0] === "duplicates") return { name: "duplicates" };
  if (parts[0] === "import") return { name: "import" };
  return { name: "not_found", path };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case "roster":
      return route.preset ? `#/clients?preset=${encodeURIComponent(route.preset)}` : "#/clients";
    case "client_new":
      return "#/clients/new";
    case "client":
      return route.mergeWith
        ? `#/clients/${encodeURIComponent(route.id)}?merge=${encodeURIComponent(route.mergeWith)}`
        : `#/clients/${encodeURIComponent(route.id)}`;
    case "client_edit":
      return `#/clients/${encodeURIComponent(route.id)}/edit`;
    case "duplicates":
      return "#/duplicates";
    case "import":
      return "#/import";
    case "not_found":
      return `#/${route.path}`;
    default: {
      const exhaustive: never = route;
      return exhaustive;
    }
  }
}

export function navigate(route: Route): void {
  window.location.hash = hrefFor(route);
}

export function useRoute(): Route {
  const read = useCallback(() => parseRoute(window.location.hash), []);
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [read]);
  return route;
}
