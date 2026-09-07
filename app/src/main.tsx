import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LocalStoragePersistence, PracticeStore } from "@/data/practiceStore";
import { seedPracticeState } from "@/data/seed";
import { App } from "@/ui/App";
import { AppProvider } from "@/ui/AppContext";
import "@/styles/tokens.css";
import "@/styles/app.css";

const store = new PracticeStore(new LocalStoragePersistence(), seedPracticeState);

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element.");

createRoot(container).render(
  <StrictMode>
    <AppProvider store={store}>
      <App />
    </AppProvider>
  </StrictMode>,
);
