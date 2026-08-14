import { Host, Image, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { useLocalSearchParams } from "expo-router";

// Flow 2 success state: "Order {id} confirmed".

export default function OrderConfirmed() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={16} modifiers={[padding({ all: 24 })]}>
        <Image systemName="checkmark.circle.fill" size={64} color="#34C759" />
        <Text modifiers={[font({ size: 28, weight: "bold" })]}>Thank you</Text>
        <Text modifiers={[foregroundStyle({ type: "color", color: "#34C759" })]}>
          Order {orderId} confirmed
        </Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
          FLOW 2 COMPLETE
        </Text>
      </VStack>
    </Host>
  );
}
