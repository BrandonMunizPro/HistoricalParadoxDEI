export const streamProfile = {
  enabled: false,
  events: [],
  totals: {},
  record(stage, ms, id = '') {
    if (!this.enabled) return;
    const total = (this.totals[stage] ??= { count: 0, ms: 0, maxMs: 0 });
    total.count++;
    total.ms += ms;
    total.maxMs = Math.max(total.maxMs, ms);
    if (ms > 0.1) {
      this.events.push({ stage, ms, id, at: performance.now() });
      if (this.events.length > 4000) this.events.shift();
    }
  },
  measure(stage, work, id = '') {
    if (!this.enabled) return work();
    const start = performance.now();
    try {
      return work();
    } finally {
      this.record(stage, performance.now() - start, id);
    }
  },
};
window.__streamProfile = streamProfile;
