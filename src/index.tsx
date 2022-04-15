import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "./index.css";
import App from "./frontend/App";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(<App />);
