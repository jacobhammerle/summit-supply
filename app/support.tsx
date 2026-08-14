import {
  Button,
  Form,
  Host,
  Image,
  Picker,
  Section,
  Text,
  TextField,
  useNativeState,
  VStack,
} from "@expo/ui/swift-ui";
import {
  fixedSize,
  font,
  foregroundStyle,
  lineLimit,
  padding,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { useRef, useState } from "react";

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
      <Host style={{ flex: 1 }}>
        <VStack spacing={16} modifiers={[padding({ all: 24 })]}>
          <Image systemName="checkmark.circle.fill" size={64} color="#34C759" />
          <Text modifiers={[font({ size: 28, weight: "bold" })]}>We got it</Text>
          <Text modifiers={[foregroundStyle({ type: "color", color: "#34C759" })]}>
            Ticket {ticketId} created
          </Text>
          <Text>Category: {category}</Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>
            FLOW 4 COMPLETE
          </Text>
        </VStack>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section header={<Text>Ticket</Text>}>
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
          <Button label="Submit ticket" onPress={submit} />
        </Section>
      </Form>
    </Host>
  );
}
