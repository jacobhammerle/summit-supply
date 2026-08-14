import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Picker,
  Section,
  Text,
  Toggle,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  frame,
  controlSize,
  font,
  foregroundStyle,
  pickerStyle,
  tag,
  tint,
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
        <Section
          header={<Text>Units</Text>}
          footer={<Text>Applies to distances, weights, and temperatures.</Text>}
        >
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
        <Section
          header={<Text>Alerts</Text>}
          footer={<Text>Trip reminders fire 24 hours before a planned hike.</Text>}
        >
          <Toggle
            label="Notifications"
            isOn={notifications}
            onIsOnChange={(v) => {
              setNotifications(v);
              setSaved(false);
            }}
            modifiers={[tint("#2E7D4F")]}
          />
          <Toggle
            label="Trip reminders"
            isOn={reminders}
            onIsOnChange={(v) => {
              setReminders(v);
              setSaved(false);
            }}
            modifiers={[tint("#2E7D4F")]}
          />
        </Section>
        <Section>
          <Button
            label="Save changes"
            onPress={save}
            modifiers={[buttonStyle("borderedProminent"), tint("#14382B"), controlSize("large"), frame({ maxWidth: 9999 })]}
          />
        </Section>
        {saved && (
          <Section>
            <HStack spacing={8}>
              <Image systemName="checkmark.circle.fill" size={17} color="#34C759" />
              <Text modifiers={[font({ size: 16, weight: "semibold" }), foregroundStyle({ type: "color", color: "#34C759" })]}>
                Settings saved
              </Text>
            </HStack>
            <Text modifiers={[font({ size: 14 })]}>{summary}</Text>
            <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: "hierarchical", style: "tertiary" })]}>
              FLOW 3 COMPLETE
            </Text>
          </Section>
        )}
      </Form>
    </Host>
  );
}
