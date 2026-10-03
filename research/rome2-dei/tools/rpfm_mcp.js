'use strict';

const HOST = process.env.RPFM_HOST || '127.0.0.1';
const PORT = process.env.RPFM_PORT || '45127';
const URL = `http://${HOST}:${PORT}/mcp`;
const PROTOCOL_VERSION = '2025-06-18';

let sessionId = null;
let protocolVersion = null;
let nextId = 1;

function parseBody(text, contentType) {
  if (!text) return null;
  if (contentType && contentType.includes('text/event-stream')) {
    const dataLines = text
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim());
    const last = dataLines[dataLines.length - 1];
    return last ? JSON.parse(last) : null;
  }
  return JSON.parse(text);
}

async function rpc(method, params, notify = false, timeoutMs = 60000) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  if (protocolVersion) headers['MCP-Protocol-Version'] = protocolVersion;

  const body = { jsonrpc: '2.0', method, params: params || {} };
  const myId = nextId++;
  if (!notify) body.id = myId;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(URL, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
  } catch (e) {
    clearTimeout(timer);
    throw new Error(`transport failure on ${method}: ${e.message}`);
  }

  const sid = res.headers.get('mcp-session-id');
  if (sid) sessionId = sid;
  const ct = res.headers.get('content-type') || '';

  if (!res.ok) {
    clearTimeout(timer);
    const t = await res.text();
    throw new Error(`HTTP ${res.status} on ${method}: ${t.slice(0, 800)}`);
  }
  if (notify) {
    clearTimeout(timer);
    try { await res.text(); } catch (_) { /* stream may stay open */ }
    return null;
  }

  // Stream incrementally so an SSE response that stays open does not hang us.
  let text = '';
  let result = null;
  let settled = false;
  try {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      text += buf;
      if (ct.includes('text/event-stream')) {
        let idx;
        let frames = buf.split(/\r?\n\r?\n/);
        buf = frames.pop();
        for (const frame of frames) {
          for (const line of frame.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            let m;
            try { m = JSON.parse(payload); } catch (_) { continue; }
            if (m && m.id === myId && (m.result !== undefined || m.error !== undefined)) {
              result = m;
              settled = true;
              ctrl.abort();
              return finish(m, method);
            }
          }
        }
      } else if (buf.length === 0) {
        settled = true;
        break;
      }
    }
  } catch (e) {
    if (!settled && !result) {
      if (e && e.name === 'AbortError') { /* timed out or we aborted deliberately */ }
      else throw new Error(`read failure on ${method}: ${e.message}`);
    }
  } finally {
    clearTimeout(timer);
  }

  const msg = parseBody(text, ct);
  return finish(msg, method);

  function finish(msg, meth) {
    if (msg && msg.error) {
      throw new Error(`JSON-RPC error on ${meth}: ${JSON.stringify(msg.error)}`);
    }
    return msg ? msg.result : null;
  }
}

async function init() {
  const res = await rpc('initialize', {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'opencode-rpfm', version: '1.0.0' },
  });
  protocolVersion = (res && res.protocolVersion) || PROTOCOL_VERSION;
  await rpc('notifications/initialized', {}, true);
  return res;
}

async function listTools() {
  const tools = [];
  let cursor;
  do {
    const res = await rpc('tools/list', cursor ? { cursor } : {});
    if (res && res.tools) tools.push(...res.tools);
    cursor = res && res.nextCursor;
  } while (cursor);
  return tools;
}

async function listResources() {
  const out = [];
  let cursor;
  do {
    const res = await rpc('resources/list', cursor ? { cursor } : {});
    if (res && res.resources) out.push(...res.resources);
    cursor = res && res.nextCursor;
  } while (cursor);
  return out;
}

async function listPrompts() {
  const res = await rpc('prompts/list', {});
  return (res && res.prompts) || [];
}

async function callTool(name, args, timeoutMs) {
  const res = await rpc('tools/call', { name, arguments: args || {} }, false, timeoutMs);
  return res;
}

function renderToolResult(res) {
  if (!res) return '';
  const parts = [];
  for (const c of res.content || []) {
    if (c.type === 'text') parts.push(c.text);
    else if (c.type === 'image') parts.push(`[image ${c.mimeType}]`);
    else parts.push(`[${c.type}]`);
  }
  let text = parts.join('\n');
  if (res.isError) text = `TOOL_ERROR: ${text}`;
  if (res.structuredContent) {
    text += `\n--- structuredContent ---\n${JSON.stringify(res.structuredContent, null, 2)}`;
  }
  return text;
}

module.exports = { init, listTools, listResources, listPrompts, callTool, renderToolResult, rpc };

if (require.main === module) {
  (async () => {
    const [cmd, ...rest] = process.argv.slice(2);
    try {
      await init();
      if (cmd === 'tools') {
        const tools = await listTools();
        console.log(`TOTAL TOOLS: ${tools.length}`);
        for (const t of tools) {
          const first = (t.description || '').split('\n')[0].slice(0, 150);
          console.log(`${t.name}\t${first}`);
        }
      } else if (cmd === 'toolinfo') {
        const want = rest[0];
        const tools = await listTools();
        const t = tools.find((x) => x.name === want);
        if (!t) {
          console.log('not found');
          process.exit(1);
        }
        console.log(JSON.stringify(t, null, 2));
      } else if (cmd === 'toolinfos') {
        const tools = await listTools();
        for (const want of rest) {
          const t = tools.find((x) => x.name === want);
          console.log(`########## ${want}`);
          if (!t) { console.log('  NOT FOUND'); continue; }
          console.log(t.description);
          console.log('SCHEMA: ' + JSON.stringify(t.inputSchema));
        }
      } else if (cmd === 'prompt') {
        const res = await rpc('prompts/get', { name: rest[0] });
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'resource') {
        const res = await rpc('resources/read', { uri: rest[0] });
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'resources') {
        console.log(JSON.stringify(await listResources(), null, 2));
      } else if (cmd === 'prompts') {
        console.log(JSON.stringify(await listPrompts(), null, 2));
      } else if (cmd === 'call') {
        const name = rest[0];
        let args = {};
        if (rest[1]) {
          const raw = rest[1].startsWith('@')
            ? require('fs').readFileSync(rest[1].slice(1), 'utf8').replace(/^\uFEFF/, '')
            : rest[1];
          args = JSON.parse(raw);
        }
        const tmo = parseInt(process.env.RPFM_TIMEOUT || '60000', 10);
        const res = await callTool(name, args, tmo);
        console.log(renderToolResult(res));
      } else {
        console.log('usage: rpfm_mcp.js tools | toolinfo <name> | resources | prompts | call <tool> <jsonArgs>');
      }
    } catch (e) {
      console.error('ERROR: ' + e.message);
      process.exit(1);
    }
  })();
}
