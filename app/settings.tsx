import {
  Button,
  Form,
  Host,
  Picker,
  Section,
  Text,
  Toggle,
} from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import { useStore } from "@/lib/store";

// Flow 3: change settings and save.
// Success state: "Settings saved" plus a summary line, for example
// "Units: metric · Notifications: off · Reminders: on".

const UNIT_OPTIONS = ["Imperial", "Metric"] as const;

export default function Settings() {
  const { settings, setSettings, markSettingsSaved } = useStore();
  const [units, setUnits] = useState<string>(
    settings.units === "imperial" ? "Imperial" : "Metric"
  );
  const [notifications, setNotifications] = useState(settings.notifications);
  const [reminders, setReminders] = useState(settings.tripReminders);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSettings({
      units: units === "Metric" ? "metric" : "imperial",
      notifications,
      tripReminders: reminders,
    });
    markSettingsSaved();
    setSaved(true);
  };

  const summary = `Units: ${units.toLowerCase()} · Notifications: ${notifications ? "on" : "off"} · Reminders: ${reminders ? "on" : "off"}`;

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section header={<Text>Units</Text>}>
          <Picker
            modifiers={[pickerStyle("segmented")]}
            label="Units"
            selection={units}
            onSelectionChange={(v) => {
              setUnits(v as string);
              setSaved(false);
            }}
          >
            {UNIT_OPTIONS.map((o) => (
              <Text key={o} modifiers={[tag(o)]}>
                {o}
              </Text>
            ))}
          </Picker>
        </Section>
        <Section header={<Text>Alerts</Text>}>
          <Toggle
            label="Notifications"
            isOn={notifications}
            onIsOnChange={(v) => {
              setNotifications(v);
              setSaved(false);
            }}
          />
          <Toggle
            label="Trip reminders"
            isOn={reminders}
            onIsOnChange={(v) => {
              setReminders(v);
              setSaved(false);
            }}
          />
        </Section>
        <Section>
          <Button label="Save changes" onPress={save} />
        </Section>
        {saved && (
          <Section>
            <Text modifiers={[foregroundStyle({ type: "color", color: "#34C759" })]}>
              Settings saved
            </Text>
            <Text modifiers={[font({ size: 14 })]}>{summary}</Text>
            <Text modifiers={[font({ size: 13 }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
              FLOW 3 COMPLETE
            </Text>
          </Section>
        )}
      </Form>
    </Host>
  );
}
