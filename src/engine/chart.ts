import type { DifficultyId, Song } from '../data/gameData';

/** Only three note gestures exist in the live ruleset. */
export type NoteType = 'tap' | 'hold' | 'flick';
export interface ChartNote {
  id: number;
  time: number;
  lane: number;
  type: NoteType;
  endTime?: number;
}

interface DifficultyConfig {
  lanes: number;
  subdivisions: number;
  density: number;
  chord: number;
  hold: number;
  flick: number;
}

const difficultyConfig: Record<DifficultyId, DifficultyConfig> = {
  seed: { lanes: 6, subdivisions: 1, density: 0.42, chord: 0.015, hold: 0.025, flick: 0.01 },
  grow: { lanes: 6, subdivisions: 1, density: 0.66, chord: 0.07, hold: 0.06, flick: 0.045 },
  skilled: { lanes: 6, subdivisions: 2, density: 0.49, chord: 0.15, hold: 0.09, flick: 0.09 },
  rage: { lanes: 6, subdivisions: 2, density: 0.67, chord: 0.24, hold: 0.1, flick: 0.16 },
  transcend: { lanes: 6, subdivisions: 3, density: 0.72, chord: 0.28, hold: 0.15, flick: 0.2 },
  chaos: { lanes: 6, subdivisions: 4, density: 0.72, chord: 0.36, hold: 0.17, flick: 0.24 },
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/**
 * A lane is reserved from the head of a long note through its tail. No tap,
 * flick, or second long note can be generated inside that same-lane interval.
 * Long notes stay in one lane for their entire duration.
 */
export function generateChart(song: Song, difficulty: DifficultyId): { notes: ChartNote[]; laneCount: number; duration: number; maxJudgements: number } {
  const config = difficultyConfig[difficulty];
  const random = seededRandom(song.seed * 31 + difficulty.length * 917 + config.lanes * 83);
  const beat = 60 / song.bpm;
  const notes: ChartNote[] = [];
  const laneBusyUntil = Array.from({ length: config.lanes }, () => 0);
  let id = 0;
  const beats = song.chartBeats ?? 96;
  const totalSteps = beats * config.subdivisions;
  let previousLane = Math.floor(random() * config.lanes);

  for (let step = 0; step < totalSteps; step += 1) {
    const beatIndex = step / config.subdivisions;
    const barPosition = beatIndex % 4;
    const accent = barPosition === 0 || barPosition === 2 ? 0.12 : 0;
    const probability = Math.min(0.96, config.density + accent);
    if (random() > probability) continue;

    const time = 1.4 + step * (beat / config.subdivisions);
    const availableLanes = Array.from({ length: config.lanes }, (_, lane) => lane)
      .filter((lane) => time >= laneBusyUntil[lane]);
    if (!availableLanes.length) continue;

    let lane = availableLanes[Math.floor(random() * availableLanes.length)];
    if (availableLanes.length > 1 && random() > 0.68) {
      const alternatives = availableLanes.filter((candidate) => candidate !== previousLane);
      if (alternatives.length) lane = alternatives[Math.floor(random() * alternatives.length)];
    }
    previousLane = lane;

    const kindRoll = random();
    let type: NoteType = 'tap';
    let endTime: number | undefined;
    if (kindRoll < config.hold) {
      type = 'hold';
      endTime = time + beat * (1.0 + random() * 1.5);
      laneBusyUntil[lane] = endTime + beat * 0.15;
    } else if (kindRoll < config.hold + config.flick) {
      type = 'flick';
    }
    notes.push({ id: id++, time, lane, type, endTime });

    // Chords may occupy another currently free lane, never the long-note lane.
    if (random() < config.chord) {
      const chordLanes = Array.from({ length: config.lanes }, (_, candidate) => candidate)
        .filter((candidate) => candidate !== lane && time >= laneBusyUntil[candidate]);
      if (chordLanes.length) {
        const secondLane = chordLanes[Math.floor(random() * chordLanes.length)];
        const secondType: NoteType = random() > 0.9 ? 'flick' : 'tap';
        notes.push({ id: id++, time, lane: secondLane, type: secondType });
      }
    }
  }

  notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
  const maxJudgements = notes.length;
  return { notes, laneCount: config.lanes, duration: 1.4 + beats * beat, maxJudgements };
}
