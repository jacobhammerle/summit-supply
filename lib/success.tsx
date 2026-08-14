import { Host, Image, Text, VStack } from "@expo/ui/swift-ui";
import type { ComponentProps } from "react";

type SFSymbol = ComponentProps<typeof Image>["systemName"];
import {
  font,
  foregroundStyle,
  kerning,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import React from "react";

// Shared success state for the QA flows.
//
// IMPORTANT: `message` is the exact string each QA agent asserts on
// (for example "Order SS-1042 confirmed"). Style around it freely, but
// never rephrase, wrap, or split it.

const GREEN = "#34C759";

export function SuccessScreen({
  icon = "checkmark.seal.fill",
  title,
  message,
  detail,
  flow,
}: {
  icon?: SFSymbol;
  title: string;
  message: string;
  detail?: string;
  flow: number;
}) {
  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={0} modifiers={[padding({ all: 28 })]}>
        <Image systemName={icon} size={76} color={GREEN} />
        <Text
          modifiers={[
            font({ size: 30, weight: "bold" }),
            padding({ top: 20 }),
          ]}
        >
          {title}
        </Text>
        <Text
          modifiers={[
            font({ size: 17, weight: "semibold" }),
            foregroundStyle({ type: "color", color: GREEN }),
            padding({ top: 10 }),
          ]}
        >
          {message}
        </Text>
        {detail ? (
          <Text
            modifiers={[
              font({ size: 15 }),
              foregroundStyle({ type: "hierarchical", style: "secondary" }),
              padding({ top: 8 }),
            ]}
          >
            {detail}
          </Text>
        ) : null}
        <Text
          modifiers={[
            font({ size: 11, weight: "medium" }),
            kerning(2),
            foregroundStyle({ type: "hierarchical", style: "tertiary" }),
            padding({ top: 28 }),
          ]}
        >
          {`FLOW ${flow} COMPLETE`}
        </Text>
      </VStack>
    </Host>
  );
}
