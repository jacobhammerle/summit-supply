import {
  Button,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
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
            <Text>Your cart is empty. Add an item from the shop.</Text>
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section header={<Text>Items</Text>}>
          {rows.map((r) => (
            <HStack key={r.product.id}>
              <Text>
                {r.product.emoji} {r.product.name} × {r.item.qty}
              </Text>
              <Spacer />
              <Text>${r.product.price * r.item.qty}</Text>
            </HStack>
          ))}
          <HStack>
            <Text>Total</Text>
            <Spacer />
            <Text modifiers={[foregroundStyle({ type: "color", color: "#14382B" })]}>
              Total ${total}
            </Text>
          </HStack>
        </Section>
        <Section>
          <Button label="Check out" onPress={() => router.push("/checkout")} />
        </Section>
      </Form>
    </Host>
  );
}
