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
  buttonStyle,
  frame,
  controlSize,
  font,
  foregroundStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";

// Flow 2, step 3: cart review with a deterministic total.

export default function Cart() {
  const { cart } = useStore();
  const router = useRouter();

  const rows = cart
    .map((c) => ({ item: c, product: getProduct(c.productId)! }))
    .filter((r) => !!r.product);
  const total = rows.reduce((sum, r) => sum + r.product.price * r.item.qty, 0);

  if (rows.length === 0) {
    return (
      <Host style={{ flex: 1 }}>
        <Form>
          <Section>
            <HStack spacing={8}>
              <Image systemName="cart" size={17} color="secondary" />
              <Text modifiers={[foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
                Your cart is empty. Add an item from the shop.
              </Text>
            </HStack>
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          header={<Text>Items</Text>}
          footer={<Text>Free shipping on orders over $75.</Text>}
        >
          {rows.map((r) => (
            <HStack key={r.product.id}>
              <Text modifiers={[font({ size: 16 })]}>
                {r.product.emoji} {r.product.name} × {r.item.qty}
              </Text>
              <Spacer />
              <Text modifiers={[foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
                ${r.product.price * r.item.qty}
              </Text>
            </HStack>
          ))}
          <HStack>
            <Text modifiers={[font({ size: 16, weight: "semibold" })]}>Total</Text>
            <Spacer />
            <Text modifiers={[font({ size: 17, weight: "bold" }), foregroundStyle({ type: "color", color: "#14382B" })]}>
              Total ${total}
            </Text>
          </HStack>
        </Section>
        <Section>
          <Button
            label="Check out"
            onPress={() => router.push("/checkout")}
            modifiers={[buttonStyle("borderedProminent"), tint("#14382B"), controlSize("large"), frame({ maxWidth: 9999 })]}
          />
        </Section>
      </Form>
    </Host>
  );
}
