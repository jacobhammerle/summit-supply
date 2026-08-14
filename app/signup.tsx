import {
  Button,
  Form,
  Host,
  Section,
  SecureField,
  Text,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  buttonStyle,
  frame,
  controlSize,
  foregroundStyle,
  keyboardType,
  textContentType,
  textInputAutocapitalization,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import { SuccessScreen } from "@/lib/success";

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
      <SuccessScreen
        icon="person.crop.circle.badge.checkmark"
        title={`Welcome, ${name.get().split(" ")[0]}`}
        message={`Account created for ${createdFor}`}
        detail="Your basecamp is ready."
        flow={1}
      />
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          header={<Text>Your details</Text>}
          footer={<Text>Join Summit Supply to track orders and trail logs.</Text>}
        >
          <TextField
            placeholder="Full name"
            text={name}
            modifiers={[textContentType("name")]}
          />
          <TextField
            placeholder="Email"
            text={email}
            modifiers={[
              keyboardType("email-address"),
              autocorrectionDisabled(),
              textInputAutocapitalization("never"),
              textContentType("emailAddress"),
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
          <Button
            label="Create account"
            onPress={submit}
            modifiers={[buttonStyle("borderedProminent"), tint("#14382B"), controlSize("large"), frame({ maxWidth: 9999 })]}
          />
        </Section>
      </Form>
    </Host>
  );
}
