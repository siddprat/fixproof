import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import type { Express } from 'express';

// Dispatch through Express without opening a port. This also works in restricted CI.
export function request(app: Express, method: string, url: string, body?: Buffer | string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; headers: ReturnType<ServerResponse['getHeaders']>; bytes: Buffer; json: () => any }>((resolve, reject) => {
    const req = new IncomingMessage(new Socket());
    req.method = method; req.url = url;
    req.headers = { ...headers, ...(body !== undefined ? { 'content-length': String(Buffer.byteLength(body)) } : {}) };
    req.rawHeaders = Object.entries(req.headers).flatMap(([key, value]) => [key, String(value)]);
    Object.defineProperty(req.socket, 'remoteAddress', { value: '127.0.0.1' });
    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];
    res.write = ((chunk: any) => { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); return true; }) as typeof res.write;
    res.end = ((chunk?: any) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const bytes = Buffer.concat(chunks);
      resolve({ status: res.statusCode, headers: res.getHeaders(), bytes, json: () => JSON.parse(bytes.toString()) });
      res.emit('finish');
      return res;
    }) as typeof res.end;
    req.on('error', reject);
    res.on('error', reject);
    app(req, res);
    if (body !== undefined) req.push(Buffer.from(body));
    req.complete = true;
    req.push(null);
  });
}
export function multipart(photos: Buffer[], note?: string) {
  const boundary = 'fixproof-test-boundary';
  const chunks: Buffer[] = [];
  for (const bytes of photos) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photos"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`), bytes, Buffer.from('\r\n'));
  if (note !== undefined) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="note"\r\n\r\n${note}\r\n`));
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}
