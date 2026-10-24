import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { z } from 'zod';
import { analysisSchema } from '../src/contract.js';
import { analysisPrompt } from '../src/ai.js';

// The shell pipes the secret into stdin. Never print it or put it in command arguments.
let input = '';
for await (const chunk of process.stdin) input += chunk.toString();
const key = input.trim();
input = '';
if (!key) throw new Error('No saved key was received.');
const model = 'gemma-4-26b-a4b-it';
const client = new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 25_000 } });
function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown request error';
  return message.split(key).join('[key hidden]')
    .replace(/AIza[\w-]+/g, '[key hidden]')
    .replace(/[A-Za-z0-9+/]{80,}={0,2}/g, '[long data hidden]')
    .slice(0, 1600);
}
async function check(label: string, action: () => Promise<unknown>) {
  try { await action(); console.log(`PASS: ${label}`); return true; }
  catch (error) {
    console.log(`FAIL: ${label}`);
    console.log(safeMessage(error));
    return false;
  }
}
console.log(`Checking ${model}. The saved API key will not be printed.`);
const accessible = await check('key and model access', () => client.models.get({ model }));
if (!accessible) {
  await check('list available Gemma model IDs', async () => {
    const pager = await client.models.list({ config: { pageSize: 100 } });
    const names: string[] = [];
    for await (const item of pager) if (item.name?.includes('gemma')) names.push(item.name);
    console.log(names.length ? names.join('\n') : 'No Gemma models listed for this key.');
  });
  process.exitCode = 1;
} else {
  const baseline = await check('basic text generation', () => client.models.generateContent({
    model, contents: 'Reply with the single word OK.', config: { maxOutputTokens: 128 },
  }));
  if (baseline) {
    const bytes = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#8899aa' } }).jpeg().toBuffer();
    const parts = [{ text: 'Describe this generated solid-color image in one sentence.' }, { inlineData: { mimeType: 'image/jpeg', data: bytes.toString('base64') } }];
    await check('image input and system instructions', () => client.models.generateContent({
      model, contents: [{ role: 'user', parts }], config: { systemInstruction: 'Describe only what is visible.', maxOutputTokens: 256 },
    }));
    const schema = z.toJSONSchema(analysisSchema);
    await check('FixProof structured JSON request', () => client.models.generateContent({
      model, contents: [{ role: 'user', parts: [{ text: `JSON schema: ${JSON.stringify(schema)}. Describe the supplied image.` }, parts[1]!] }],
      config: { systemInstruction: analysisPrompt, temperature: 0.2, maxOutputTokens: 4096, responseMimeType: 'application/json', responseJsonSchema: schema },
    }));
  } else process.exitCode = 1;
}
