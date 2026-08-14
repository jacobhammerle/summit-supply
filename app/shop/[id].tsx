import {
  Button,
  Form,
  Host,
  Section,
  Text,
} from "@expo/ui/swift-ui";
import { font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
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
        <Section header={<Text>{product.emoji} {product.name}</Text>}>
          <Text modifiers={[font({ size: 22, weight: "bold" })]}>${product.price}</Text>
          <Text modifiers={[font({ size: 15 }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
            {product.blurb}
          </Text>
        </Section>
        {added && (
          <Section>
            <Text modifiers={[foregroundStyle({ type: "color", color: "#34C759" })]}>
              Added {product.name} to cart
            </Text>
          </Section>
        )}
        <Section>
          <Button
            label="Add to cart"
            onPress={() => {
              addToCart(product.id);
              setAdded(true);
            }}
          />
          <Button label="Go to cart" onPress={() => router.push("/cart")} />
        </Section>
      </Form>
    </Host>
  );
}
