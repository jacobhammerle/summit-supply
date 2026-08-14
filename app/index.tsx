import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  background,
  buttonStyle,
  clipShape,
  contentShape,
  font,
  foregroundStyle,
  frame,
  kerning,
  listRowBackground,
  padding,
  shapes,
} from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";

// The hub is a native SwiftUI Form. Each row is a flow.
// SwiftUI exposes the row text as the accessibility label,
// which is what agent-device snapshots read.

const PINE = "#14382B";

const FLOWS = [
  { href: "/signup", icon: "person.badge.plus", tint: "#34C759", label: "Create account", note: "Sign-up form with validation" },
  { href: "/shop", icon: "cart.fill", tint: "#007AFF", label: "Shop and check out", note: "Browse, cart, order confirmation" },
  { href: "/settings", icon: "gearshape.fill", tint: "#8E8E93", label: "Settings", note: "Units, toggles, save state" },
  { href: "/support", icon: "lifepreserver.fill", tint: "#FF9500", label: "File a support ticket", note: "Form, category, ticket ID" },
  { href: "/offline", icon: "arrow.triangle.2.circlepath", tint: "#AF52DE", label: "Trail logs", note: "Queue offline, sync online" },
] as const;

export default function Home() {
  const router = useRouter();

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        {/* Brand hero card */}
        <Section>
          <VStack
            spacing={8}
            modifiers={[
              padding({ vertical: 22 }),
              frame({ maxWidth: 9999 }),
              listRowBackground(PINE),
            ]}
          >
            <Image
              systemName="mountain.2.fill"
              size={40}
              color="#E8F0EA"
            />
            <Text modifiers={[font({ size: 26, weight: "bold" }), foregroundStyle({ type: "color", color: "#FFFFFF" })]}>
              Summit Supply
            </Text>
            <Text
              modifiers={[
                font({ size: 12, weight: "medium" }),
                kerning(1.6),
                foregroundStyle({ type: "color", color: "#9DBBA9" }),
              ]}
            >
              OUTDOOR GEAR · EST. 2019
            </Text>
          </VStack>
        </Section>
        <Section header={<Text>QA demo build · 5 flows</Text>}>
          {FLOWS.map((f) => (
            <Button
              key={f.href}
              onPress={() => router.push(f.href)}
              modifiers={[buttonStyle("plain"), accessibilityLabel(f.label)]}
            >
              {/* contentShape makes the Spacer gap tappable too. Without it
                  only the Text and Image hit-test, so a tap on the middle of a
                  short row ("Settings", "Trail logs") falls through. */}
              <HStack spacing={12} modifiers={[contentShape(shapes.rectangle()), padding({ vertical: 2 })]}>
                <Image
                  systemName={f.icon}
                  color="white"
                  size={15}
                  modifiers={[
                    frame({ width: 30, height: 30 }),
                    background(f.tint),
                    clipShape("roundedRectangle", 8),
                  ]}
                />
                <VStack alignment="leading" spacing={2}>
                  <Text modifiers={[font({ size: 16 }), foregroundStyle({ type: "color", color: "primary" })]}>
                    {f.label}
                  </Text>
                  <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
                    {f.note}
                  </Text>
                </VStack>
                <Spacer />
                <Image systemName="chevron.right" size={12} color="tertiary" />
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
