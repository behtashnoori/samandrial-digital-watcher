import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMocks } from "./mocks";

await initMocks();

createRoot(document.getElementById("root")!).render(<App />);
