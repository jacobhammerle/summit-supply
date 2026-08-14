import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  clipShape,
  contentShape,
  font,
  foregroundStyle,
  frame,
  shapes,
} from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";

// The hub is a native SwiftUI Form. Each row is a flow.
// SwiftUI exposes the row text as the accessibility label,
// which is what agent-device snapshots read.

const FLOWS = [
  { href: "/signup", icon: "person.badge.plus", tint: "#34C759", label: "Create account", note: "Sign-up form with validation" },
  { href: "/shop", icon: "cart", tint: "#007AFF", label: "Shop and check out", note: "Browse, cart, order confirmation" },
  { href: "/settings", icon: "gearshape", tint: "#8E8E93", label: "Settings", note: "Units, toggles, save state" },
  { href: "/support", icon: "lifepreserver", tint: "#FF9500", label: "File a support ticket", note: "Form, category, ticket ID" },
  { href: "/offline", icon: "arrow.triangle.2.circlepath", tint: "#AF52DE", label: "Trail logs", note: "Queue offline, sync online" },
] as const;

export default function Home() {
  const router = useRouter();

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section header={<Text>QA demo build · 5 flows</Text>}>
          {FLOWS.map((f) => (
            <Button
              key={f.href}
              onPress={() => router.push(f.href)}
              modifiers={[buttonStyle("plain")]}
            >
              {/* contentShape makes the Spacer gap tappable too. Without it
                  only the Text and Image hit-test, so a tap on the middle of a
                  short row ("Settings", "Trail logs") falls through. */}
              <HStack spacing={10} modifiers={[contentShape(shapes.rectangle())]}>
                <Image
                  systemName={f.icon}
                  color="white"
                  size={16}
                  modifiers={[
                    frame({ width: 28, height: 28 }),
                    background(f.tint),
                    clipShape("roundedRectangle"),
                  ]}
                />
                <Text modifiers={[foregroundStyle({ type: "color", color: "primary" })]}>
                  {f.label}
                </Text>
                <Spacer />
                <Image systemName="chevron.right" size={13} color="secondary" />
              </HStack>
            </Button>
          ))}
        </Section>
        <Section footer={<Text modifiers={[font({ size: 13 })]}>Each flow ends in a verifiable success state for agent QA.</Text>}>
          <Text />
        </Section>
      </Form>
    </Host>
  );
}
