// src/organisms/FormRenderer/FieldSettingsAIAgent/aiService.ts

export async function askAI(userPrompt: string) {
  const systemPrompt = `
You are a form-config generator. Respond with VALID JSON ONLY: an array of SettingsItem objects matching this interface exactly:

{
  name: string,
  label: string,
  type: one of text|number|textarea|dropdown|date|email|radio|checkbox|switch|radio-group|checkbox-group|radio-button-group|switch-group,
  placeholder?: string,
  validation?: (z: typeof import('zod'), data?: any) => ZodTypeAny,
  col?: { xs?: number; sm?: number; md?: number; lg?: number },
  disabled?: boolean,
  options?: [{ value: string, text: string }]
}

To group fields you may emit either:
- header (string) + fields (SettingsItem[])
- tabs: [{ title: string, fields: SettingsItem[] }, …]

No other keys. No comments. No markdown fences. No code wrappers.

Now: ${userPrompt}
`;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: systemPrompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`API error (${res.status}): ${text}`), {
      raw: text,
    });
  }
  const { fieldSettings } = await res.json();
  return fieldSettings;
}

export async function askAIWithImage(userPrompt: string, imageData: string) {
  // Send prompt AND image in the same JSON payload
  const systemPrompt = `
You are a form-config generator. Respond with VALID JSON ONLY: an array of SettingsItem objects matching this interface exactly:

{
  name: string,
  label: string,
  type: one of text|number|textarea|dropdown|date|email|radio|checkbox|switch|radio-group|checkbox-group|radio-button-group|switch-group,
  placeholder?: string,
  validation?: (z: typeof import('zod'), data?: any) => ZodTypeAny,
  col?: { xs?: number; sm?: number; md?: number; lg?: number },
  disabled?: boolean,
  options?: [{ value: string, text: string }]
}

To group fields you may emit either:
- header (string) + fields (SettingsItem[])
- tabs: [{ title: string, fields: SettingsItem[] }, …]

No other keys. No comments. No markdown fences. No code wrappers.

Now: ${userPrompt}
`;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: systemPrompt,
      image: imageData,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`API error (${res.status}): ${text}`), {
      raw: text,
    });
  }
  const { fieldSettings } = await res.json();
  return fieldSettings;
}
