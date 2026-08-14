import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  multilineTextAlignment,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";

// Flow 2, step 2: product detail. Deep link target:
//   summitsupply://shop/ridgeline-tent-2

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getProduct(id);
  const { addToCart } = useStore();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <Host style={{ flex: 1 }}>
        <Form>
          <Section>
            <Text modifiers={[foregroundStyle({ type: "color", color: "#B3402E" })]}>
              No product with ID "{id}".
            </Text>
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section>
          <VStack spacing={6} modifiers={[padding({ vertical: 14 }), frame({ maxWidth: 9999 })]}>
            <Text modifiers={[font({ size: 56 })]}>{product.emoji}</Text>
            <Text modifiers={[font({ size: 22, weight: "bold" })]}>{product.name}</Text>
            <Text modifiers={[font({ size: 28, weight: "bold" }), foregroundStyle({ type: "color", color: "#14382B" })]}>
              ${product.price}
            </Text>
            <Text
              modifiers={[
                font({ size: 14 }),
                multilineTextAlignment("center"),
                foregroundStyle({ type: "hierarchical", style: "secondary" }),
              ]}
            >
              {product.blurb}
            </Text>
          </VStack>
        </Section>
        {added && (
          <Section>
            <HStack spacing={8}>
              <Image systemName="checkmark.circle.fill" size={17} color="#34C759" />
              <Text modifiers={[foregroundStyle({ type: "color", color: "#34C759" })]}>
                Added {product.name} to cart
              </Text>
            </HStack>
          </Section>
        )}
        <Section>
          <Button
            label="Add to cart"
            onPress={() => {
              addToCart(product.id);
              setAdded(true);
            }}
            modifiers={[buttonStyle("borderedProminent"), tint("#14382B"), controlSize("large"), frame({ maxWidth: 9999 })]}
          />
          <Button label="Go to cart" onPress={() => router.push("/cart")} />
        </Section>
      </Form>
    </Host>
  );
}
