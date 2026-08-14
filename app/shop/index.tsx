import {
  Button,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  background,
  buttonStyle,
  controlSize,
  clipShape,
  contentShape,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  shapes,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { PRODUCTS } from "@/lib/products";
import { useStore } from "@/lib/store";

// Flow 2, step 1: browse the catalog.

export default function Shop() {
  const { cart } = useStore();
  const router = useRouter();
  const count = cart.reduce((n, c) => n + c.qty, 0);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          header={<Text>Gear</Text>}
          footer={<Text>Every item is field-tested by our trail crew.</Text>}
        >
          {PRODUCTS.map((p) => (
            <Button
              key={p.id}
              onPress={() => router.push(`/shop/${p.id}`)}
              modifiers={[buttonStyle("plain"), accessibilityLabel(p.name)]}
            >
              {/* Make the whole row tappable, including the Spacer gap. */}
              <HStack spacing={12} modifiers={[contentShape(shapes.rectangle()), padding({ vertical: 2 })]}>
                <Text
                  modifiers={[
                    font({ size: 22 }),
                    frame({ width: 40, height: 40 }),
                    background("#EDF2EE"),
                    clipShape("roundedRectangle", 9),
                  ]}
                >
                  {p.emoji}
                </Text>
                <VStack alignment="leading" spacing={2}>
                  <Text modifiers={[font({ size: 16 }), foregroundStyle({ type: "color", color: "primary" })]}>
                    {p.name}
                  </Text>
                  <Text
                    modifiers={[
                      font({ size: 12 }),
                      lineLimit(1),
                      foregroundStyle({ type: "hierarchical", style: "secondary" }),
                    ]}
                  >
                    {p.blurb}
                  </Text>
                </VStack>
                <Spacer />
                <Text modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle({ type: "color", color: "#14382B" })]}>
                  ${p.price}
                </Text>
              </HStack>
            </Button>
          ))}
        </Section>
        <Section>
          <Button
            label={`View cart (${count})`}
            onPress={() => router.push("/cart")}
            modifiers={[buttonStyle("borderedProminent"), tint("#14382B"), controlSize("large"), frame({ maxWidth: 9999 })]}
          />
        </Section>
      </Form>
    </Host>
  );
}
