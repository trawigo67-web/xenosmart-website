// Günlük – Einstieg des Workers: /api/* beantworten, alle 5 Minuten fällige Erinnerungen verschicken
import { handle, tick } from './core.js';

export default {
  async fetch(request, env) {
    const p = new URL(request.url).pathname;
    if (p === '/api' || p.indexOf('/api/') === 0) return handle(request, env);
    return Response.redirect('https://xenosmart.de/mustafa/', 302);      // hier gibt es nichts zu sehen: zur App
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(tick(env, Date.now()).catch((e) => console.error('tick', e && (e.stack || e.message))));
  },
};
