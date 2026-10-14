import interRegular from "@/assets/fonts/inter-0.ttf.asset.json";
import interMedium from "@/assets/fonts/inter-1.ttf.asset.json";
import interSemibold from "@/assets/fonts/inter-2.ttf.asset.json";
import interBold from "@/assets/fonts/inter-3.ttf.asset.json";
import poppinsRegular from "@/assets/fonts/poppins-0.ttf.asset.json";
import poppinsMedium from "@/assets/fonts/poppins-1.ttf.asset.json";
import poppinsSemibold from "@/assets/fonts/poppins-2.ttf.asset.json";
import poppinsBold from "@/assets/fonts/poppins-3.ttf.asset.json";

/** The local Vite server does not serve the hosted asset gateway. */
export function initializeDiscoveryPresentation() {
  const fonts = [
    ["Inter", interRegular, "400"], ["Inter", interMedium, "500"],
    ["Inter", interSemibold, "600"], ["Inter", interBold, "700"],
    ["Poppins", poppinsRegular, "400"], ["Poppins", poppinsMedium, "500"],
    ["Poppins", poppinsSemibold, "600"], ["Poppins", poppinsBold, "700"],
  ] as const;
  for (const [family, asset, weight] of fonts) {
    const url = import.meta.env.DEV
      ? new URL(asset.url, "https://text-to-look-magic.lovable.app").href
      : asset.url;
    const face = new FontFace(family, `url("${url}")`, { weight, display: "swap" });
    document.fonts.add(face);
    face.load().catch(() => {
      // Keep the readable system fallback when font delivery is unavailable.
    });
  }
}