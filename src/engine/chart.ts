import type { DifficultyId, Song } from '../data/gameData';

export type NoteType = 'tap' | 'hold' | 'slide' | 'flick' | 'special';
export interface ChartNote {
  id: number;
  time: number;
  lane: number;
  type: NoteType;
  endTime?: number;
  endLane?: number;
}

const difficultyConfig: Record<DifficultyId, { lanes: number; subdivisions: number; density: number; chord: number; hold: number; slide: number; flick: number; special: number }> = {
  seed: { lanes: 2, subdivisions: 1, density: 0.42, chord: 0.015, hold: 0.025, slide: 0, flick: 0.01, special: 0 },
  grow: { lanes: 2, subdivisions: 1, density: 0.66, chord: 0.07, hold: 0.06, slide: 0.015, flick: 0.045, special: 0.01 },
  skilled: { lanes: 2, subdivisions: 2, density: 0.49, chord: 0.15, hold: 0.09, slide: 0.06, flick: 0.09, special: 0.035 },
  rage: { lanes: 2, subdivisions: 2, density: 0.67, chord: 0.24, hold: 0.1, slide: 0.12, flick: 0.16, special: 0.07 },
  transcend: { lanes: 2, subdivisions: 3, density: 0.72, chord: 0.28, hold: 0.15, slide: 0.18, flick: 0.2, special: 0.1 },
  chaos: { lanes: 4, subdivisions: 4, density: 0.72, chord: 0.36, hold: 0.17, slide: 0.24, flick: 0.24, special: 0.14 },
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function generateChart(song: Song, difficulty: DifficultyId): { notes: ChartNote[]; laneCount: number; duration: number; maxJudgements: number } {
  const config = difficultyConfig[difficulty];
  const random = seededRandom(song.seed * 31 + difficulty.length * 917 + config.lanes * 83);
  const beat = 60 / song.bpm;
  const notes: ChartNote[] = [];
  let id = 0;
  const beats = 96;
  const totalSteps = beats * config.subdivisions;
  let previousLane = Math.floor(random() * config.lanes);

  for (let step = 0; step < totalSteps; step += 1) {
    const beatIndex = step / config.subdivisions;
    const barPosition = beatIndex % 4;
    const accent = barPosition === 0 || barPosition === 2 ? 0.12 : 0;
    const probability = Math.min(0.96, config.density + accent);
    if (random() > probability) continue;

    let lane = Math.floor(random() * config.lanes);
    if (difficulty !== 'chaos' && random() > 0.72) lane = 1 - previousLane;
    if (difficulty === 'chaos' && random() > 0.68) lane = (previousLane + 1 + Math.floor(random() * 3)) % 4;
    previousLane = lane;

    const time = 1.4 + step * (beat / config.subdivisions);
    const kindRoll = random();
    let type: NoteType = 'tap';
    let endTime: number | undefined;
    let endLane: number | undefined;
    if (kindRoll < config.hold) {
      type = 'hold';
      endTime = time + beat * (0.75 + random() * 1.1);
    } else if (kindRoll < config.hold + config.slide) {
      type = 'slide';
      endTime = time + beat * (0.55 + random() * 0.9);
      endLane = (lane + 1 + Math.floor(random() * (config.lanes - 1))) % config.lanes;
    } else if (kindRoll < config.hold + config.slide + config.flick) {
      type = 'flick';
    } else if (kindRoll < config.hold + config.slide + config.flick + config.special) {
      type = 'special';
    }
    notes.push({ id: id++, time, lane, type, endTime, endLane });

    if (random() < config.chord) {
      let secondLane = lane;
      while (secondLane === lane) secondLane = Math.floor(random() * config.lanes);
      notes.push({ id: id++, time, lane: secondLane, type: random() > 0.86 ? 'flick' : 'tap' });
    }
    if (difficulty === 'chaos' && random() < config.chord * 0.28) {
      const used = new Set(notes.filter((note) => note.time === time).map((note) => note.lane));
      const freeLanes = [0, 1, 2, 3].filter((index) => !used.has(index));
      if (freeLanes.length) notes.push({ id: id++, time, lane: freeLanes[Math.floor(random() * freeLanes.length)], type: 'tap' });
    }
  }

  notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
  // A hold or slide contributes one judgement when its complete gesture resolves.
  const maxJudgements = notes.length;
  return { notes, laneCount: config.lanes, duration: 1.4 + beats * beat, maxJudgements };
}
