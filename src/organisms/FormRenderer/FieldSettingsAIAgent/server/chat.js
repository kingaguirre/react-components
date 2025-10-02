// src/organisms/FormRenderer/FieldSettingsAIAgent/server/chat.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️  MISSING OPENAI_API_KEY');
  process.exit(1);
}

const app = express();
const port = 3001;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/chat', async (req, res) => {
  const { prompt, image } = req.body;
  if (!prompt && !image) {
    return res.status(400).json({ error: 'Missing prompt or image' });
  }

  const systemPrompt = `
You are a form-config generator with vision. 
If given an image, first analyze the UI layout and text labels in it, 
then generate an array of SettingsItem objects matching this interface exactly.
Respond with VALID JSON ONLY: an array of SettingsItem objects…
`.trim();

  const messages = [{ role: 'system', content: systemPrompt }];
  if (prompt) messages.push({ role: 'user', content: prompt });
  if (image) {
    // **Embed** the Data-URL as a markdown image so the model can see it
    const imageMarkdown = `Here is the form screenshot:\n\n![screenshot](${image})`;
    messages.push({ role: 'user', content: imageMarkdown });
  }

  try {
    const aiRes = await client.chat.completions.create({
      model: image ? 'gpt-4o-mini' : 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    });

    const raw = aiRes.choices?.[0]?.message?.content;
    if (typeof raw !== 'string') {
      return res.status(502).json({ error: 'No text content from AI' });
    }

    // sanitize & extract JSON array
    let content = raw.replace(/```[\s\S]*?```/g, '');
    const arrMatch = content.match(/\[([\s\S]*)\]/);
    if (arrMatch) content = `[${arrMatch[1]}]`;
    content = content.trim();

    let fieldSettings;
    try {
      fieldSettings = JSON.parse(content);
    } catch (e) {
      return res.status(502).json({
        error: 'Invalid JSON from OpenAI',
        raw,
        cleaned: content,
      });
    }

    if (!Array.isArray(fieldSettings)) {
      return res.status(502).json({
        error: 'Parsed value is not an array',
        cleaned: fieldSettings,
      });
    }

    return res.json({ fieldSettings });
  } catch (err) {
    console.error('AI proxy error:', err);
    return res.status(500).json({ error: err.message || 'AI error' });
  }
});

app.listen(port, () => {
  console.log(`AI proxy running at http://localhost:${port}/chat`);
});
