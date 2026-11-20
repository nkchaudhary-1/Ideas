import { createRoot } from "react-dom/client";
import EditorShell from "@/components/editor/EditorShell";
import { preloadFonts } from "@/lib/fonts";

// The page is served from a folder of static files, so bundled assets are fetched relatively.
(globalThis as { __ASSET_BASE__?: string }).__ASSET_BASE__ = "";

// UI chrome font (the Next build declares these in CSS; here they load as bytes)
void preloadFonts([{ family: "Manrope", weight: 400 }, { family: "Manrope", weight: 600 }, { family: "Manrope", weight: 800 }]);

createRoot(document.getElementById("root")!).render(<EditorShell />);
