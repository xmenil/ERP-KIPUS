import { describe, expect, it } from 'vitest';
import { createLatestRequest } from './latestRequest';

describe('respuestas de consultas superpuestas', () => {
  it('descarta respuestas viejas en diez recorridos de consulta y desmontaje', async () => {
    const gate = createLatestRequest();
    for (let round = 0; round < 10; round++) {
      const results: string[] = [];
      let resolveOld!: (value: string) => void;
      const old = gate.begin();
      const pending = new Promise<string>(resolve => { resolveOld = resolve; })
        .then(value => { if (gate.isCurrent(old)) results.push(value); });
      const latest = gate.begin();
      if (gate.isCurrent(latest)) results.push('nuevo');
      resolveOld('antiguo');
      await pending;
      expect(results).toEqual(['nuevo']);
      gate.invalidate();
      expect(gate.isCurrent(latest)).toBe(false);
    }
  });
});
