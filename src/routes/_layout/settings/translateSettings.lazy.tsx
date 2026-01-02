import { createLazyFileRoute } from "@tanstack/react-router";
import TranslateSettings from "@/pages/settings/translateSettings";

export const Route = createLazyFileRoute("/_layout/settings/translateSettings")({
    component: TranslateSettingsComponent,
});

function TranslateSettingsComponent() {
    return <TranslateSettings />;
}
