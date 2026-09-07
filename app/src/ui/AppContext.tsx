import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { PracticeState } from "@/data/practiceState";
import type { PracticeStore } from "@/data/practiceStore";
import type { PracticeUser } from "@/domain/roles";

interface AppContextValue {
  store: PracticeStore;
  currentUser: PracticeUser;
  setCurrentUserId: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const CURRENT_USER_KEY = "althio.practice.currentUser";

export function AppProvider({ store, children }: { store: PracticeStore; children: ReactNode }) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(CURRENT_USER_KEY) : null;
    return stored ?? state.users[0]?.id ?? "";
  });

  const value = useMemo<AppContextValue>(() => {
    const currentUser = state.users.find((u) => u.id === currentUserId) ?? state.users[0];
    if (!currentUser) throw new Error("The practice has no users configured.");
    return {
      store,
      currentUser,
      setCurrentUserId: (id: string) => {
        window.localStorage.setItem(CURRENT_USER_KEY, id);
        setCurrentUserIdState(id);
      },
    };
  }, [store, state.users, currentUserId]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider.");
  return value;
}

export function usePracticeState(): PracticeState {
  const { store } = useApp();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Users who can be assigned as a clinician on a client. */
export function useClinicians(): PracticeUser[] {
  const state = usePracticeState();
  return useMemo(
    () => state.users.filter((u) => u.role === "clinician" || u.role === "clinical_director"),
    [state.users],
  );
}

export function useUserName(): (id: string | undefined) => string {
  const state = usePracticeState();
  return (id) => (id ? state.users.find((u) => u.id === id)?.name ?? "Unknown" : "—");
}
