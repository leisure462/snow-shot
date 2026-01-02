import { createLazyFileRoute } from "@tanstack/react-router";
import OcrSettings from "@/pages/settings/ocrSettings";

export const Route = createLazyFileRoute("/_layout/settings/ocrSettings")({
    component: OcrSettingsComponent,
});

function OcrSettingsComponent() {
    return <OcrSettings />;
}
