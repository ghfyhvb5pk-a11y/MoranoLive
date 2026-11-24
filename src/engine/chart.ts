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
  /** Steps used in each four-beat phrase.  These are authored rhythm patterns,
   * not a probability used to spray notes through the song. */
  pattern: readonly number[];
  chordSteps: readonly number[];
  holdBars: readonly number[];
  flickSteps: readonly number[];
}

const difficultyConfig: Record<DifficultyId, DifficultyConfig> = {
  seed: { lanes: 6, subdivisions: 1, pattern: [0, 2], chordSteps: [], holdBars: [7], flickSteps: [] },
  grow: { lanes: 6, subdivisions: 1, pattern: [0, 1, 2, 3], chordSteps: [0], holdBars: [5, 13], flickSteps: [3] },
  skilled: { lanes: 6, subdivisions: 2, pattern: [0, 2, 4, 6, 7], chordSteps: [0, 4], holdBars: [3, 9, 15], flickSteps: [7] },
  rage: { lanes: 6, subdivisions: 2, pattern: [0, 1, 2, 4, 5, 6, 7], chordSteps: [0, 4], holdBars: [7, 15], flickSteps: [5, 7] },
  transcend: { lanes: 6, subdivisions: 4, pattern: [0, 2, 4, 6, 8, 10, 11, 12, 14], chordSteps: [0, 8], holdBars: [3, 11], flickSteps: [6, 11, 14] },
  chaos: { lanes: 6, subdivisions: 4, pattern: [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 14, 15], chordSteps: [0, 4, 8, 12], holdBars: [5, 13], flickSteps: [5, 11, 15] },
};

/**
 * A lane is reserved from the head of a long note through its tail. No tap,
 * flick, or second long note can be generated inside that same-lane interval.
 * Long notes stay in one lane for their entire duration.
 */
export function generateChart(song: Song, difficulty: DifficultyId, startTime = song.audioSrc ? (song.audioLeadIn ?? 0) : 1.4): { notes: ChartNote[]; laneCount: number; duration: number; maxJudgements: number } {
  const config = difficultyConfig[difficulty];
  const beat = 60 / song.bpm;
  const notes: ChartNote[] = [];
  const laneBusyUntil = Array.from({ length: config.lanes }, () => 0);
  let id = 0;
  const beats = song.chartBeats ?? 96;
  const bars = Math.floor(beats / 4);
  const stepsPerBar = config.subdivisions * 4;
  const songPhase = song.seed % config.lanes;

  const canPlace = (lane: number, time: number) => time >= laneBusyUntil[lane];
  const add = (time: number, lane: number, type: NoteType, endTime?: number) => {
    if (!canPlace(lane, time)) return;
    notes.push({ id: id++, time, lane, type, endTime });
    if (type === 'hold' && endTime !== undefined) laneBusyUntil[lane] = endTime + beat * 0.12;
  };

  // A four-beat phrase is repeated with lane rotations and alternating hand
  // shapes. This is deterministic and musical: downbeats, backbeats and
  // phrase endings always have a stable purpose at every difficulty.
  for (let bar = 0; bar < bars; bar += 1) {
    const phrase = Math.floor(bar / 4);
    const laneShift = (songPhase + phrase * 2 + (bar % 2)) % config.lanes;
    for (const step of config.pattern) {
      const time = startTime + (bar * stepsPerBar + step) * (beat / config.subdivisions);
      const lane = (laneShift + Math.floor(step / Math.max(1, config.subdivisions)) + step) % config.lanes;
      const isHold = config.holdBars.includes(bar % 16) && step === config.pattern[0];
      const isFlick = !isHold && config.flickSteps.includes(step) && (bar + phrase) % 2 === 1;
      add(time, lane, isHold ? 'hold' : isFlick ? 'flick' : 'tap', isHold ? time + beat * (1.5 + (bar % 3) * 0.5) : undefined);

      if (config.chordSteps.includes(step) && (bar + step) % 2 === 0) {
        const secondLane = (lane + 3 + (phrase % 2)) % config.lanes;
        add(time, secondLane, 'tap');
      }
    }
  }

  notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
  const maxJudgements = notes.length;
  return { notes, laneCount: config.lanes, duration: startTime + beats * beat, maxJudgements };
}
