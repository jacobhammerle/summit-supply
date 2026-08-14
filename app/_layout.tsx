import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StoreProvider } from "@/lib/store";

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerTintColor: "#14382B",
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "Summit Supply", headerShown: false }}
        />
        <Stack.Screen name="signup" options={{ title: "Create account" }} />
        <Stack.Screen name="shop/index" options={{ title: "Shop" }} />
        <Stack.Screen name="shop/[id]" options={{ title: "Product" }} />
        <Stack.Screen name="cart" options={{ title: "Cart" }} />
        <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
        <Stack.Screen name="order-confirmed" options={{ title: "Order confirmed" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="support" options={{ title: "Support" }} />
        <Stack.Screen name="offline" options={{ title: "Trail logs" }} />
      </Stack>
    </StoreProvider>
  );
}
