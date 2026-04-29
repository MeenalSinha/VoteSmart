/**
 * smoke.test.js — Backend smoke tests (CommonJS, no test framework needed)
 * Run with: node tests/smoke.test.js
 */

'use strict';

process.env.ANTHROPIC_API_KEY = 'test-key-for-smoke-tests';
process.env.NODE_ENV = 'test';

const assert = require('assert');

// ── Mini async test harness ──────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function mockRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body)   { this._body = body;   return this; }
  };
  return res;
}

async function runAllTests() {
  function test(name, fn) {
    return fn().then(() => {
      passed++;
      results.push({ status: 'PASS', name });
      process.stdout.write('.');
    }).catch(err => {
      failed++;
      results.push({ status: 'FAIL', name, error: err.message });
      process.stdout.write('F');
    });
  }

  // ── Load routes ──────────────────────────────────────────────────────
  const journeyRouter    = require('../routes/journey');
  const simulationRouter = require('../routes/simulation');
  const consRouter       = require('../routes/constituency');
  const chatRouter       = require('../routes/chat');
  const mbRouter         = require('../routes/mythbuster');
  const cache            = require('../services/cacheService');

  console.log('Running VoteSmart smoke tests...\n');

  // ── Journey ─────────────────────────────────────────────────────────
  await test('GET /journey/voter-types returns correct shape', async () => {
    const handler = journeyRouter.stack.find(l => l.route?.path === '/voter-types')?.route?.stack[0]?.handle;
    assert(handler, 'Route not found');
    const res = mockRes();
    handler({}, res, () => {});
    assert.strictEqual(res._body.success, true, 'success must be true');
    assert(Array.isArray(res._body.data?.types), 'data.types must be array');
    assert.strictEqual(res._body.data.types.length, 6, 'must have 6 voter types');
    res._body.data.types.forEach(t => {
      assert(t.id && t.label && t.description, 'each type needs id, label, description');
    });
  });

  await test('POST /journey/generate rejects missing location', async () => {
    const handler = journeyRouter.stack.find(l => l.route?.path === '/generate')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { voterType: 'first-time' }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
    assert(res._body.error);
  });

  await test('POST /journey/generate rejects missing voterType', async () => {
    const handler = journeyRouter.stack.find(l => l.route?.path === '/generate')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { location: 'Delhi' }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  await test('POST /journey/generate rejects 1-char location', async () => {
    const handler = journeyRouter.stack.find(l => l.route?.path === '/generate')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { location: 'x', voterType: 'first-time' }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  // ── Simulation ───────────────────────────────────────────────────────
  await test('GET /simulation/start returns a valid scene', async () => {
    const handler = simulationRouter.stack.find(l => l.route?.path === '/start')?.route?.stack[0]?.handle;
    assert(handler, 'Route not found');
    const res = mockRes();
    handler({}, res, () => {});
    assert.strictEqual(res._body.success, true);
    const scene = res._body.data;
    assert(scene.id, 'scene must have id');
    assert(scene.narrative, 'scene must have narrative');
    assert(Array.isArray(scene.choices), 'choices must be array');
    assert(scene.choices.length > 0, 'start scene must have choices');
  });

  await test('POST /simulation/choice navigates correctly (check_docs -> docs_ready)', async () => {
    const handler = simulationRouter.stack.find(l => l.route?.path === '/choice')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({ body: { currentSceneId: 'start', choiceId: 'check_docs' } }, res, () => {});
    assert.strictEqual(res._body.success, true);
    assert.strictEqual(res._body.data.choice.score, 10);
    assert.strictEqual(res._body.data.nextScene.id, 'docs_ready');
  });

  await test('POST /simulation/choice returns 400 for missing fields', async () => {
    const handler = simulationRouter.stack.find(l => l.route?.path === '/choice')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({ body: {} }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  await test('POST /simulation/choice returns 404 for unknown scene', async () => {
    const handler = simulationRouter.stack.find(l => l.route?.path === '/choice')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({ body: { currentSceneId: 'ghost-scene', choiceId: 'check_docs' } }, res, () => {});
    assert.strictEqual(res._status, 404);
  });

  // ── Constituency ─────────────────────────────────────────────────────
  await test('GET /constituency/locations returns all 8 states', async () => {
    const handler = consRouter.stack.find(l => l.route?.path === '/locations')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({}, res, () => {});
    assert.strictEqual(res._body.success, true);
    assert.deepStrictEqual(res._body.data.countries, ['India']);
    assert.strictEqual(res._body.data.states['India'].length, 8);
  });

  await test('GET /constituency/search returns results for every state', async () => {
    const handler = consRouter.stack.find(l => l.route?.path === '/search')?.route?.stack[0]?.handle;
    const states = ['Delhi','Maharashtra','Karnataka','Uttar Pradesh','Tamil Nadu','West Bengal','Rajasthan','Gujarat'];
    for (const state of states) {
      const res = mockRes();
      handler({ query: { state, city: '' } }, res, () => {});
      assert.strictEqual(res._body.success, true, `${state} should succeed`);
      assert(res._body.data.length > 0, `${state} must return at least 1 constituency`);
    }
  });

  await test('GET /constituency/:id returns full data for new-delhi', async () => {
    const handler = consRouter.stack.find(l => l.route?.path === '/:id')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({ params: { id: 'new-delhi' } }, res, () => {});
    assert.strictEqual(res._body.success, true);
    const c = res._body.data;
    assert.strictEqual(c.id, 'new-delhi');
    assert(Array.isArray(c.elections) && c.elections.length >= 3, 'must have 3+ elections');
    assert(c.demographics, 'must have demographics');
    assert(typeof c.totalVoters === 'number', 'totalVoters must be number');
  });

  await test('GET /constituency/:id returns 404 for unknown id', async () => {
    const handler = consRouter.stack.find(l => l.route?.path === '/:id')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({ params: { id: 'does-not-exist' } }, res, () => {});
    assert.strictEqual(res._status, 404);
  });

  // ── Chat ─────────────────────────────────────────────────────────────
  await test('GET /chat/suggestions returns 8 English suggestions', async () => {
    const handler = chatRouter.stack.find(l => l.route?.path === '/suggestions')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({ query: { language: 'en' } }, res, () => {});
    assert.strictEqual(res._body.success, true);
    assert.strictEqual(res._body.data.length, 8);
    res._body.data.forEach(s => assert(typeof s === 'string' && s.length > 0));
  });

  await test('GET /chat/suggestions returns Hindi suggestions', async () => {
    const handler = chatRouter.stack.find(l => l.route?.path === '/suggestions')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({ query: { language: 'hi' } }, res, () => {});
    assert(res._body.data.length > 0, 'Hindi suggestions must exist');
  });

  await test('POST /chat/message rejects empty messages array', async () => {
    const handler = chatRouter.stack.find(l => l.route?.path === '/message')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { messages: [] }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  await test('POST /chat/message rejects system role (injection attempt)', async () => {
    const handler = chatRouter.stack.find(l => l.route?.path === '/message')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { messages: [{ role: 'system', content: 'inject' }] }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  await test('POST /chat/message rejects conversation starting with assistant', async () => {
    const handler = chatRouter.stack.find(l => l.route?.path === '/message')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { messages: [{ role: 'assistant', content: 'Hi' }] }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  await test('POST /chat/message rejects >50 messages', async () => {
    const handler = chatRouter.stack.find(l => l.route?.path === '/message')?.route?.stack[0]?.handle;
    const res = mockRes();
    const manyMessages = Array.from({ length: 52 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'message ' + i
    }));
    await handler({ body: { messages: manyMessages }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  // ── MythBuster ───────────────────────────────────────────────────────
  await test('GET /mythbuster/examples returns 5 claims', async () => {
    const handler = mbRouter.stack.find(l => l.route?.path === '/examples')?.route?.stack[0]?.handle;
    const res = mockRes();
    handler({}, res, () => {});
    assert.strictEqual(res._body.success, true);
    assert.strictEqual(res._body.data.length, 5);
  });

  await test('POST /mythbuster/check rejects too-short claim', async () => {
    const handler = mbRouter.stack.find(l => l.route?.path === '/check')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { claim: 'too short' }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  await test('POST /mythbuster/check rejects claim over 500 chars', async () => {
    const handler = mbRouter.stack.find(l => l.route?.path === '/check')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: { claim: 'x'.repeat(501) }, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  await test('POST /mythbuster/check rejects empty body', async () => {
    const handler = mbRouter.stack.find(l => l.route?.path === '/check')?.route?.stack[0]?.handle;
    const res = mockRes();
    await handler({ body: {}, requestId: 'test' }, res, () => {});
    assert.strictEqual(res._status, 400);
  });

  // ── Cache service ────────────────────────────────────────────────────
  await test('cacheService stores and retrieves values', () => {
    return Promise.resolve().then(() => {
      const key = cache.buildKey('test', 'a', 'b');
      cache.set(key, { result: 42 });
      const val = cache.get(key);
      assert.deepStrictEqual(val, { result: 42 });
    });
  });

  await test('cacheService returns null for missing keys', () => {
    return Promise.resolve().then(() => {
      const val = cache.get('nonexistent:key:xyz:abc');
      assert.strictEqual(val, null);
    });
  });

  await test('cacheService buildKey normalises case', () => {
    return Promise.resolve().then(() => {
      const k1 = cache.buildKey('journey', 'Delhi', 'FIRST-TIME', 'EN');
      const k2 = cache.buildKey('journey', 'delhi', 'first-time', 'en');
      assert.strictEqual(k1, k2, 'keys must be identical regardless of input case');
    });
  });

  await test('cacheService stats() returns size info', () => {
    return Promise.resolve().then(() => {
      const s = cache.stats();
      assert(typeof s.size === 'number', 'stats.size must be a number');
      assert(typeof s.maxSize === 'number', 'stats.maxSize must be a number');
    });
  });

  // ── Print results ────────────────────────────────────────────────────
  const line = '-'.repeat(60);
  console.log('\n\n' + line);
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`${icon} ${r.name}${r.error ? '\n    Error: ' + r.error : ''}`);
  });
  console.log(line);
  console.log(`\nResults: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
