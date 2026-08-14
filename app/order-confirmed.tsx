import { useLocalSearchParams } from "expo-router";
import { SuccessScreen } from "@/lib/success";

// Flow 2 success state: "Order {id} confirmed".

export default function OrderConfirmed() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  return (
    <SuccessScreen
      icon="shippingbox.fill"
      title="Thank you"
      message={`Order ${orderId} confirmed`}
      detail="Your gear ships within 2 business days."
      flow={2}
    />
  );
}
