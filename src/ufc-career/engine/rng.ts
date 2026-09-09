export interface CareerRng {
  seed: string;
  step: number;
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string, startStep = 0): CareerRng {
  let state = hashSeed(seed);
  let step = 0;
  const rng: CareerRng = {
    seed,
    step: startStep,
    next() {
      while (step <= this.step) {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        state = value;
        step += 1;
      }
      this.step += 1;
      return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
    },
    int(min: number, max: number) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick<T>(items: readonly T[]) {
      return items[this.int(0, items.length - 1)];
    },
  };
  return rng;
}

export function dailyCareerSeed(date = new Date()) {
  return `grdx1-daily-${date.toISOString().slice(0, 10)}`;
}
