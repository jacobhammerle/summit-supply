import {
  Button,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  contentShape,
  foregroundStyle,
  shapes,
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
        <Section header={<Text>Gear</Text>}>
          {PRODUCTS.map((p) => (
            <Button
              key={p.id}
              onPress={() => router.push(`/shop/${p.id}`)}
              modifiers={[buttonStyle("plain")]}
            >
              {/* Make the whole row tappable, including the Spacer gap. */}
              <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                <Text>{p.emoji}</Text>
                <Text modifiers={[foregroundStyle({ type: "color", color: "primary" })]}>
                  {p.name}
                </Text>
                <Spacer />
                <Text modifiers={[foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
                  ${p.price}
                </Text>
              </HStack>
            </Button>
          ))}
        </Section>
        <Section>
          <Button label={`View cart (${count})`} onPress={() => router.push("/cart")} />
        </Section>
      </Form>
    </Host>
  );
}
