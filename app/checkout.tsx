import {
  Button,
  Form,
  Host,
  Section,
  Text,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  foregroundStyle,
  keyboardType,
} from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useStore } from "@/lib/store";

// Flow 2, step 4: checkout. All payment data is mock data.
// The card number 4242 4242 4242 4242 is a standard test number.

export default function Checkout() {
  const { placeOrder } = useStore();
  const router = useRouter();
  const name = useNativeState("");
  const card = useNativeState("");
  const zip = useNativeState("");
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const next: string[] = [];
    if (name.get().trim().length < 2) next.push("Enter the name on the card.");
    if (card.get().replace(/\s/g, "").length !== 16) next.push("Card number must have 16 digits.");
    if (zip.get().trim().length < 5) next.push("Enter a 5-digit ZIP code.");
    setErrors(next);
    if (next.length === 0) {
      const orderId = placeOrder();
      router.replace({ pathname: "/order-confirmed", params: { orderId } });
    }
  };

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          header={<Text>Payment</Text>}
          footer={<Text>Demo checkout. Use test card 4242 4242 4242 4242.</Text>}
        >
          <TextField placeholder="Name on card" text={name} modifiers={[autocorrectionDisabled()]} />
          <TextField
            placeholder="Card number"
            text={card}
            modifiers={[keyboardType("numeric")]}
          />
          <TextField
            placeholder="ZIP code"
            text={zip}
            modifiers={[keyboardType("numeric")]}
          />
        </Section>
        {errors.length > 0 && (
          <Section header={<Text>Fix these problems</Text>}>
            {errors.map((e) => (
              <Text key={e} modifiers={[foregroundStyle({ type: "color", color: "#B3402E" })]}>
                {e}
              </Text>
            ))}
          </Section>
        )}
        <Section>
          <Button label="Place order" onPress={submit} />
        </Section>
      </Form>
    </Host>
  );
}
