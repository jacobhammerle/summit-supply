import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Spacer,
  Text,
  Toggle,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  frame,
  controlSize,
  font,
  foregroundStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

// Flow 5: offline queue and sync.
// The network state is simulated inside the app. This keeps the flow
// deterministic on remote simulators.
//
// Agent script: turn "Simulate offline" ON, add 3 logs, verify each log
// shows "Pending sync", turn offline OFF, verify "3 of 3 logs synced".

export default function OfflineSync() {
  const { online, setOnline, logs, addLog, syncLogs } = useStore();

  const pending = logs.filter((l) => l.status === "pending").length;
  const synced = logs.filter((l) => l.status === "synced").length;

  // When the app returns online, sync the queue after a short delay.
  useEffect(() => {
    if (online && pending > 0) {
      const t = setTimeout(syncLogs, 1500);
      return () => clearTimeout(t);
    }
  }, [online, pending, syncLogs]);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          header={<Text>Network</Text>}
          footer={
            <Text>{online ? "NETWORK: ONLINE" : "NETWORK: OFFLINE. New logs will queue for sync."}</Text>
          }
        >
          <Toggle
            label="Simulate offline"
            isOn={!online}
            onIsOnChange={(v) => setOnline(!v)}
            modifiers={[tint("#B77D12")]}
          />
        </Section>
        <Section>
          <Button
            label="Add trail log"
            onPress={addLog}
            modifiers={[buttonStyle("borderedProminent"), tint("#14382B"), controlSize("large"), frame({ maxWidth: 9999 })]}
          />
        </Section>
        <Section header={<Text>Trail logs ({logs.length})</Text>}>
          {logs.length === 0 && (
            <HStack spacing={8}>
              <Image systemName="figure.hiking" size={16} color="secondary" />
              <Text modifiers={[foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
                No logs yet.
              </Text>
            </HStack>
          )}
          {logs.map((l) => (
            <HStack key={l.id} spacing={8}>
              <Image
                systemName={l.status === "synced" ? "checkmark.icloud.fill" : "icloud.slash"}
                size={15}
                color={l.status === "synced" ? "#34C759" : "#B77D12"}
              />
              <Text modifiers={[font({ size: 16 })]}>{l.title}</Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ size: 13, weight: "medium" }),
                  foregroundStyle({
                    type: "color",
                    color: l.status === "synced" ? "#34C759" : "#B77D12",
                  }),
                ]}
              >
                {l.status === "synced" ? "Synced" : "Pending sync"}
              </Text>
            </HStack>
          ))}
        </Section>
        {online && logs.length > 0 && pending === 0 && (
          <Section>
            <HStack spacing={8}>
              <Image systemName="checkmark.circle.fill" size={17} color="#34C759" />
              <Text modifiers={[font({ size: 16, weight: "semibold" }), foregroundStyle({ type: "color", color: "#34C759" })]}>
                {synced} of {logs.length} logs synced
              </Text>
            </HStack>
            <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: "hierarchical", style: "tertiary" })]}>
              FLOW 5 COMPLETE
            </Text>
          </Section>
        )}
      </Form>
    </Host>
  );
}
