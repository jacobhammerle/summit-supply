import {
  Button,
  Form,
  Host,
  Image,
  Section,
  SecureField,
  Text,
  TextField,
  useNativeState,
  VStack,
} from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  font,
  foregroundStyle,
  keyboardType,
  padding,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";

// Flow 1: Create account.
// Success state text: "Account created for {email}".

export default function SignUp() {
  const name = useNativeState("");
  const email = useNativeState("");
  const password = useNativeState("");
  const confirm = useNativeState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [createdFor, setCreatedFor] = useState<string | null>(null);

  const submit = () => {
    const next: string[] = [];
    if (name.get().trim().length < 2) next.push("Enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.get())) next.push("Enter a valid email address.");
    if (password.get().length < 8) next.push("Password must have 8 or more characters.");
    if (confirm.get() !== password.get()) next.push("Passwords do not match.");
    setErrors(next);
    if (next.length === 0) setCreatedFor(email.get());
  };

  if (createdFor) {
    return (
      <Host style={{ flex: 1 }}>
        <VStack spacing={16} modifiers={[padding({ all: 24 })]}>
          <Image systemName="checkmark.circle.fill" size={64} color="#34C759" />
          <Text modifiers={[font({ size: 28, weight: "bold" })]}>Welcome, {name.get().split(" ")[0]}</Text>
          <Text modifiers={[foregroundStyle({ type: "color", color: "#34C759" })]}>
            Account created for {createdFor}
          </Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
            FLOW 1 COMPLETE
          </Text>
        </VStack>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section header={<Text>Your details</Text>}>
          <TextField placeholder="Full name" text={name} />
          <TextField
            placeholder="Email"
            text={email}
            modifiers={[
              keyboardType("email-address"),
              autocorrectionDisabled(),
              textInputAutocapitalization("never"),
            ]}
          />
        </Section>
        <Section
          header={<Text>Password</Text>}
          footer={<Text>Use 8 or more characters.</Text>}
        >
          <SecureField placeholder="Password" text={password} />
          <SecureField placeholder="Confirm password" text={confirm} />
        </Section>
        {errors.length > 0 && (
          <Section header={<Text>Fix these problems</Text>}>
            {errors.map((e) => (
              <Text
                key={e}
                modifiers={[foregroundStyle({ type: "color", color: "#B3402E" })]}
              >
                {e}
              </Text>
            ))}
          </Section>
        )}
        <Section>
          <Button label="Create account" onPress={submit} />
        </Section>
      </Form>
    </Host>
  );
}
