import {
  Button,
  Form,
  Host,
  Picker,
  Section,
  Text,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  frame,
  controlSize,
  fixedSize,
  foregroundStyle,
  lineLimit,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useRef, useState } from "react";
import { SuccessScreen } from "@/lib/success";

// Flow 4: file a support ticket.
// Success state: "Ticket SS-7301 created" (IDs increment per session).

const CATEGORIES = ["Order issue", "Returns", "Gear question", "Other"];

export default function Support() {
  const subject = useNativeState("");
  const detail = useNativeState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [errors, setErrors] = useState<string[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const counter = useRef(7300);

  const submit = () => {
    const next: string[] = [];
    if (subject.get().trim().length < 3) next.push("Enter a subject.");
    if (detail.get().trim().length < 10) next.push("Describe the issue in 10 or more characters.");
    setErrors(next);
    if (next.length === 0) {
      counter.current += 1;
      setTicketId(`SS-${counter.current}`);
    }
  };

  if (ticketId) {
    return (
      <SuccessScreen
        icon="envelope.badge.fill"
        title="We got it"
        message={`Ticket ${ticketId} created`}
        detail={`Category: ${category}`}
        flow={4}
      />
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          header={<Text>Ticket</Text>}
          footer={<Text>Our gear team replies within one business day.</Text>}
        >
          <TextField placeholder="Subject" text={subject} />
        </Section>
        <Section header={<Text>Category</Text>}>
          <Picker
            modifiers={[pickerStyle("menu")]}
            label="Category"
            selection={category}
            onSelectionChange={(v) => setCategory(v as string)}
          >
            {CATEGORIES.map((c) => (
              <Text key={c} modifiers={[tag(c)]}>
                {c}
              </Text>
            ))}
          </Picker>
        </Section>
        <Section header={<Text>What happened?</Text>}>
          <TextField
            axis="vertical"
            placeholder="Give us the details."
            text={detail}
            modifiers={[lineLimit(5), fixedSize({ horizontal: false, vertical: true })]}
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
          <Button
            label="Submit ticket"
            onPress={submit}
            modifiers={[buttonStyle("borderedProminent"), tint("#14382B"), controlSize("large"), frame({ maxWidth: 9999 })]}
          />
        </Section>
      </Form>
    </Host>
  );
}
