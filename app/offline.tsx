import {
  Button,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
  Toggle,
} from "@expo/ui/swift-ui";
import { font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
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
          />
        </Section>
        <Section>
          <Button label="Add trail log" onPress={addLog} />
        </Section>
        <Section header={<Text>Trail logs ({logs.length})</Text>}>
          {logs.length === 0 && (
            <Text modifiers={[foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
              No logs yet.
            </Text>
          )}
          {logs.map((l) => (
            <HStack key={l.id}>
              <Text>{l.title}</Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ size: 14 }),
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
            <Text modifiers={[foregroundStyle({ type: "color", color: "#34C759" })]}>
              {synced} of {logs.length} logs synced
            </Text>
            <Text modifiers={[font({ size: 13 }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
              FLOW 5 COMPLETE
            </Text>
          </Section>
        )}
      </Form>
    </Host>
  );
}
