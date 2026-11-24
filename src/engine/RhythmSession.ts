import type { DifficultyId, Song } from '../data/gameData';
import { generateChart, type ChartNote } from './chart';

export type Judge = 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS';
export interface LiveStats {
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  life: number;
  perfect: number;
  great: number;
  good: number;
  bad: number;
  miss: number;
  judged: number;
  total: number;
  lastJudge: Judge | null;
}
export interface LiveResult extends LiveStats {
  rank: string;
  fullCombo: boolean;
  allPerfect: boolean;
  songId: string;
  difficulty: DifficultyId;
  durationPlayed: number;
}
export interface SessionOptions {
  noteSpeed: number;
  timingOffset: number;
  volume: number;
  laneGuide?: boolean;
  teamSkills?: { scoreBonus: number; greatScoreBonus: number; perfectScoreBonus: number; lifeShield: number; lifeHeal: number; gradeAssist: boolean; badAssist: boolean; timingAssistMs: number; };
  onUpdate: (stats: LiveStats, songTime: number) => void;
  onFinish: (result: LiveResult) => void;
}

class AudioTransport {
  private context: AudioContext;
  private master: GainNode;
  private scheduled: Set<AudioScheduledSourceNode> = new Set();
  private startAt = 0;
  private disposed = false;

  constructor(volume: number) {
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error('이 브라우저는 Web Audio API를 지원하지 않습니다. 최신 브라우저에서 실행해 주세요.');
    this.context = new AudioContextConstructor();
    this.master = this.context.createGain();
    this.master.gain.value = volume;
    this.master.connect(this.context.destination);
  }

  get time() {
    return this.context.currentTime - this.startAt;
  }

  async play(song: Song) {
    await this.context.resume();
    this.stopScheduled();
    this.startAt = this.context.currentTime + 0.38;
    // The chart uses a 1.4 s visual lead-in; put the soundtrack's beat-zero on that same clock.
    this.scheduleMusic(song, this.startAt + 1.4);
  }

  private track(node: AudioScheduledSourceNode) {
    this.scheduled.add(node);
    node.onended = () => this.scheduled.delete(node);
  }

  private tone(when: number, frequency: number, duration: number, wave: OscillatorType, volume: number, attack = 0.008, endFrequency?: number) {
    if (this.disposed || when < this.context.currentTime - 0.03) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(Math.max(25, frequency), when);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), when + duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    this.track(oscillator);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.025);
  }

  private noise(when: number, duration: number, volume: number, highpass: number) {
    const bufferSize = Math.max(1, Math.ceil(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < bufferSize; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize);
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    this.track(source);
    source.start(when);
    source.stop(when + duration + 0.02);
  }

  private scheduleMusic(song: Song, startAt: number) {
    const beat = 60 / song.bpm;
    const rootNotes = [55, 61.74, 65.41, 73.42, 82.41, 87.31, 98, 110];
    const root = rootNotes[song.seed % rootNotes.length];
    const scale = [0, 3, 5, 7, 10, 12, 15, 17, 19];
    const chord = [0, 3, 7, 10];
    const melody = [0, 3, 5, 7, 5, 3, 10, 7, 12, 10, 7, 5, 3, 5, 7, 10];
    const patternOffset = song.seed % 4;

    for (let beatIndex = 0; beatIndex < 96; beatIndex += 1) {
      const when = startAt + beatIndex * beat;
      const barBeat = beatIndex % 4;
      // Original, procedural drum and bass arrangement; all events are scheduled on the audio clock.
      if (barBeat === 0 || (song.bpm > 150 && barBeat === 2)) {
        this.tone(when, 112, 0.19, 'sine', 0.19, 0.004, 42);
      }
      if (barBeat === 2 || (song.seed % 3 === 0 && barBeat === 0)) {
        this.noise(when, 0.13, 0.055, 1100);
        this.tone(when, 185, 0.1, 'triangle', 0.045, 0.004, 125);
      }
      this.noise(when + beat / 2, 0.045, 0.018, 6000);
      if (beatIndex % 2 === 0) {
        const bassOffset = scale[(beatIndex * 3 + patternOffset) % scale.length];
        this.tone(when + 0.015, root * Math.pow(2, bassOffset / 12), beat * 0.62, 'triangle', 0.09, 0.012, root * 0.5);
      }
      if (beatIndex % 4 === 0) {
        chord.forEach((step, index) => {
          const frequency = root * 2 * Math.pow(2, (step + (patternOffset === 1 ? 2 : 0)) / 12);
          this.tone(when + index * 0.012, frequency, beat * 3.55, 'sine', 0.024, 0.16);
        });
      }
      if (beatIndex % 2 === 1 || (song.bpm > 155 && beatIndex % 4 === 0)) {
        const note = melody[(Math.floor(beatIndex / 2) + patternOffset) % melody.length];
        this.tone(when + 0.025, root * 4 * Math.pow(2, note / 12), beat * 0.42, 'square', 0.025, 0.008);
      }
      if (song.bpm < 115 && beatIndex % 4 === 2) {
        this.tone(when + 0.02, root * 3, beat * 0.8, 'triangle', 0.035, 0.09);
      }
    }
  }

  setVolume(volume: number) {
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.context.currentTime, 0.035);
  }

  async pause() {
    if (this.context.state === 'running') await this.context.suspend();
  }

  async resume() {
    if (this.context.state === 'suspended') await this.context.resume();
  }

  private stopScheduled() {
    for (const node of this.scheduled) {
      try { node.stop(); } catch { /* a source may already have ended */ }
    }
    this.scheduled.clear();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopScheduled();
    this.master.disconnect();
    void this.context.close();
  }
}

interface RuntimeNote extends ChartNote {
  started: boolean;
  done: boolean;
  startGrade?: Judge;
  effectUntil?: number;
}

const KEY_MAP: Record<string, number> = { f: 0, j: 1, d: 0, k: 1 };
const APPEND_KEY_MAP: Record<string, number> = { d: 0, f: 1, j: 2, k: 3 };

export class RhythmSession {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private song: Song;
  private difficulty: DifficultyId;
  private options: SessionOptions;
  private transport: AudioTransport;
  private notes: RuntimeNote[];
  private laneCount: number;
  private duration: number;
  private maxJudgements: number;
  private raf = 0;
  private lastUiUpdate = 0;
  private paused = false;
  private ended = false;
  private started = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private resizeObserver: ResizeObserver;
  private keyLanes = new Set<number>();
  private pointerLanes = new Map<number, number>();
  private pointerOrigins = new Map<number, { x: number; y: number }>();
  private stats: LiveStats;
  private particles: { x: number; y: number; until: number; color: string }[] = [];
  private inputEffects: { x: number; y: number; startedAt: number; until: number; color: string; lane: number; kind: 'touch' | 'key' | 'flick' }[] = [];
  private trailEffects: { x: number; y: number; until: number; color: string }[] = [];
  private lanePulseUntil: number[] = [];
  private onKeyDownBound: (event: KeyboardEvent) => void;
  private onKeyUpBound: (event: KeyboardEvent) => void;
  private onPointerDownBound: (event: PointerEvent) => void;
  private onPointerMoveBound: (event: PointerEvent) => void;
  private onPointerUpBound: (event: PointerEvent) => void;

  constructor(canvas: HTMLCanvasElement, song: Song, difficulty: DifficultyId, options: SessionOptions) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 렌더링을 초기화하지 못했습니다.');
    this.context = context;
    this.song = song;
    this.difficulty = difficulty;
    this.options = options;
    const chart = generateChart(song, difficulty);
    this.notes = chart.notes.map((note) => ({ ...note, started: false, done: false }));
    this.laneCount = chart.laneCount;
    this.lanePulseUntil = Array.from({ length: this.laneCount }, () => 0);
    this.duration = chart.duration;
    this.maxJudgements = chart.maxJudgements;
    this.transport = new AudioTransport(options.volume);
    this.stats = { score: 0, combo: 0, maxCombo: 0, accuracy: 100, life: 100, perfect: 0, great: 0, good: 0, bad: 0, miss: 0, judged: 0, total: this.maxJudgements, lastJudge: null };

    this.onKeyDownBound = (event) => this.onKeyDown(event);
    this.onKeyUpBound = (event) => this.onKeyUp(event);
    this.onPointerDownBound = (event) => this.onPointerDown(event);
    this.onPointerMoveBound = (event) => this.onPointerMove(event);
    this.onPointerUpBound = (event) => this.onPointerUp(event);
    this.canvas.addEventListener('pointerdown', this.onPointerDownBound);
    this.canvas.addEventListener('pointermove', this.onPointerMoveBound);
    this.canvas.addEventListener('pointerup', this.onPointerUpBound);
    this.canvas.addEventListener('pointercancel', this.onPointerUpBound);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.resize();
  }

  async start() {
    if (this.started) return;
    this.started = true;
    await this.transport.play(this.song);
    this.loop();
  }

  setVolume(value: number) { this.transport.setVolume(value); }

  async pause() {
    if (this.ended || this.paused) return;
    this.paused = true;
    await this.transport.pause();
  }

  async resume() {
    if (this.ended || !this.paused) return;
    await this.transport.resume();
    this.paused = false;
  }

  isPaused() { return this.paused; }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.draw(0);
  }

  private laneAt(clientX: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const playableLeft = this.width * 0.055;
    const playableWidth = this.width * 0.89;
    return Math.max(0, Math.min(this.laneCount - 1, Math.floor(((x - playableLeft) / playableWidth) * this.laneCount)));
  }

  private addInputFeedback(lane: number, x: number, y: number, kind: 'touch' | 'key' | 'flick') {
    const color = kind === 'flick' ? '#ff91ca' : kind === 'key' ? '#ffe28e' : '#7cf4df';
    this.lanePulseUntil[lane] = this.songTime() + 0.28;
    this.inputEffects.push({ x, y, startedAt: this.songTime(), until: this.songTime() + 0.52, color, lane, kind });
    if (this.inputEffects.length > 28) this.inputEffects.splice(0, this.inputEffects.length - 28);
  }

  private onPointerDown(event: PointerEvent) {
    if (this.paused || !this.started || this.ended) return;
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    const rect = this.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const lane = this.laneAt(event.clientX);
    this.pointerLanes.set(event.pointerId, lane);
    this.pointerOrigins.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.addInputFeedback(lane, localX, localY, 'touch');
    this.pressLane(lane, false);
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.pointerLanes.has(event.pointerId)) return;
    const rect = this.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const lane = this.laneAt(event.clientX);
    this.pointerLanes.set(event.pointerId, lane);
    const origin = this.pointerOrigins.get(event.pointerId);
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) {
      this.trailEffects.push({ x: localX, y: localY, until: this.songTime() + 0.2, color: '#ff9dce' });
      if (this.trailEffects.length > 36) this.trailEffects.shift();
    }
    if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
      const time = this.songTime();
      const nearest = this.notes.find((note) => !note.done && !note.started && note.type === 'flick' && (note.lane === lane || note.lane === this.laneAt(origin.x)) && Math.abs(time - note.time - this.options.timingOffset / 1000) <= 0.22);
      if (nearest) {
        this.hitNote(nearest, this.gradeFor(time - nearest.time - this.options.timingOffset / 1000));
        this.addInputFeedback(nearest.lane, localX, localY, 'flick');
      } else if (lane !== this.laneAt(origin.x)) {
        this.lanePulseUntil[lane] = time + 0.12;
      }
      this.pointerOrigins.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
  }

  private onPointerUp(event: PointerEvent) {
    this.pointerLanes.delete(event.pointerId);
    this.pointerOrigins.delete(event.pointerId);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.repeat || this.paused || !this.started || this.ended) return;
    if (event.key === 'Escape') return;
    const map = this.difficulty === 'chaos' ? APPEND_KEY_MAP : KEY_MAP;
    const lane = map[event.key.toLowerCase()];
    if (lane === undefined || lane >= this.laneCount) return;
    event.preventDefault();
    this.keyLanes.add(lane);
    this.addInputFeedback(lane, this.laneCenter(lane), this.height * 0.82, 'key');
    this.pressLane(lane, true);
  }

  private onKeyUp(event: KeyboardEvent) {
    const map = this.difficulty === 'chaos' ? APPEND_KEY_MAP : KEY_MAP;
    const lane = map[event.key.toLowerCase()];
    if (lane !== undefined) this.keyLanes.delete(lane);
  }

  private laneHeld(lane: number) {
    return this.keyLanes.has(lane) || [...this.pointerLanes.values()].includes(lane);
  }

  private pressLane(lane: number, fromKeyboard: boolean) {
    const time = this.songTime();
    const candidates = this.notes.filter((note) => !note.done && !note.started && note.lane === lane)
      .filter((note) => Math.abs(time - note.time - this.options.timingOffset / 1000) <= 0.205)
      .sort((a, b) => Math.abs(time - a.time) - Math.abs(time - b.time));
    const note = candidates[0];
    if (!note) return;
    // Keyboard flicks are discrete presses; touch flicks may also be triggered by a short swipe.
    if (note.type === 'flick' && !fromKeyboard) return;
    const grade = this.gradeFor(time - note.time - this.options.timingOffset / 1000);
    this.hitNote(note, grade);
  }

  private hitNote(note: RuntimeNote, grade: Judge) {
    if (note.done || note.started) return;
    if (note.type === 'hold' || note.type === 'slide') {
      note.started = true;
      note.startGrade = grade;
      note.effectUntil = this.songTime() + 0.22;
      this.addInputFeedback(note.lane, this.laneCenter(note.lane), this.height * 0.82, 'touch');
      return;
    }
    note.done = true;
    note.effectUntil = this.songTime() + 0.3;
    this.record(grade);
    const laneX = this.laneCenter(note.lane);
    this.particles.push({ x: laneX, y: this.height * 0.82, until: this.songTime() + 0.42, color: grade === 'PERFECT' ? '#fff4b8' : '#80e8ff' });
    this.addInputFeedback(note.lane, laneX, this.height * 0.82, note.type === 'flick' ? 'flick' : 'touch');
  }

  private gradeFor(delta: number): Judge {
    const absolute = Math.abs(delta);
    const assist = (this.options.teamSkills?.timingAssistMs || 0) / 1000;
    if (absolute <= 0.045 + assist) return 'PERFECT';
    if (absolute <= 0.09 + assist) return 'GREAT';
    if (absolute <= 0.14 + assist) return 'GOOD';
    if (absolute <= 0.205 + assist) return 'BAD';
    return 'MISS';
  }

  private record(grade: Judge) {
    const skills = this.options.teamSkills;
    if (grade === 'GOOD' && skills?.gradeAssist && (this.stats.good + 1) % 4 === 0) grade = 'GREAT';
    if (grade === 'BAD' && skills?.badAssist && (this.stats.bad + 1) % 3 === 0) grade = 'GOOD';
    this.stats.lastJudge = grade;
    this.stats.judged += 1;
    if (grade === 'PERFECT') { this.stats.perfect += 1; this.stats.combo += 1; this.stats.life = Math.min(100, this.stats.life + 0.25 + (skills?.lifeHeal || 0) * 0.01); }
    else if (grade === 'GREAT') { this.stats.great += 1; this.stats.combo += 1; }
    else if (grade === 'GOOD') { this.stats.good += 1; this.stats.combo += 1; this.stats.life = Math.max(0, this.stats.life - 1 * (1 - (skills?.lifeShield || 0) / 100)); }
    else if (grade === 'BAD') { this.stats.bad += 1; this.stats.combo = 0; this.stats.life = Math.max(0, this.stats.life - 5 * (1 - (skills?.lifeShield || 0) / 100)); }
    else { this.stats.miss += 1; this.stats.combo = 0; this.stats.life = Math.max(0, this.stats.life - 8 * (1 - (skills?.lifeShield || 0) / 100)); }
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
    const accuracyPoints = this.stats.perfect * 100 + this.stats.great * 80 + this.stats.good * 50 + this.stats.bad * 20;
    this.stats.accuracy = this.stats.judged ? (accuracyPoints / (this.stats.judged * 100)) * 100 : 100;
    const scorePoints = this.stats.perfect * 1000 * (1 + (skills?.scoreBonus || 0) / 100 + (skills?.perfectScoreBonus || 0) / 100) + this.stats.great * 800 * (1 + (skills?.scoreBonus || 0) / 100 + (skills?.greatScoreBonus || 0) / 100) + this.stats.good * 500 * (1 + (skills?.scoreBonus || 0) / 100) + this.stats.bad * 200 * (1 + (skills?.scoreBonus || 0) / 100);
    this.stats.score = Math.min(1000000, Math.round((scorePoints / Math.max(1, this.maxJudgements * 1000)) * 1000000));
  }

  private songTime() {
    return Math.max(0, this.transport.time);
  }

  private laneCenter(lane: number) {
    const left = this.width * 0.055;
    const playableWidth = this.width * 0.89;
    return left + playableWidth * ((lane + 0.5) / this.laneCount);
  }

  private processNotes(time: number) {
    const offset = this.options.timingOffset / 1000;
    for (const note of this.notes) {
      if (note.done) continue;
      if (note.started && note.endTime !== undefined) {
        if (time >= note.endTime + offset + 0.205) {
          const targetLane = note.type === 'slide' ? (note.endLane ?? note.lane) : note.lane;
          const held = this.laneHeld(targetLane);
          note.done = true;
          const grade = held ? (note.startGrade || 'GOOD') : 'MISS';
          this.record(grade);
          note.effectUntil = time + 0.25;
          this.particles.push({ x: this.laneCenter(targetLane), y: this.height * 0.82, until: time + 0.42, color: held ? '#83f1c4' : '#ff758f' });
          this.addInputFeedback(targetLane, this.laneCenter(targetLane), this.height * 0.82, held ? 'touch' : 'flick');
        }
      } else if (!note.started && time > note.time + offset + 0.205) {
        note.done = true;
        this.record('MISS');
        note.effectUntil = time + 0.25;
      }
    }
  }

  private loop = () => {
    if (this.ended) return;
    const time = this.songTime();
    if (!this.paused) this.processNotes(time);
    this.draw(time);
    const now = performance.now();
    if (now - this.lastUiUpdate > 75) {
      this.options.onUpdate({ ...this.stats }, time);
      this.lastUiUpdate = now;
    }
    if (time > this.duration + 2.4 && this.notes.every((note) => note.done)) {
      this.finish(time);
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(time: number) {
    const ctx = this.context;
    const { width, height } = this;
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);

    // Cinematic dark stage with a bright playfield, moving beat grid and soft spotlights.
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#090d1b');
    background.addColorStop(0.52, '#15152c');
    background.addColorStop(1, '#21182f');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.22, 4, width * 0.5, height * 0.3, Math.max(width, height) * 0.72);
    glow.addColorStop(0, 'rgba(125,111,255,.20)');
    glow.addColorStop(0.55, 'rgba(78,91,175,.055)');
    glow.addColorStop(1, 'rgba(5,8,18,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    for (let index = 0; index < 48; index += 1) {
      const x = (index * 113.17 + 19) % width;
      const y = (index * 79.31 + 11) % height;
      const pulse = 0.04 + (index % 5) * 0.018;
      ctx.fillStyle = `rgba(220,228,255,${pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, (index % 3) + 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    const left = width * 0.055;
    const playableWidth = width * 0.89;
    const laneWidth = playableWidth / this.laneCount;
    const targetY = height * 0.835;
    const pixelsPerSecond = Math.min(440, Math.max(285, height * 0.57)) * this.options.noteSpeed;
    const beatDuration = 60 / this.song.bpm;

    // Lanes are individually readable and light up while a key/finger is held or pressed.
    for (let lane = 0; lane < this.laneCount; lane += 1) {
      const x = left + lane * laneWidth;
      const held = this.laneHeld(lane);
      const pulse = Math.max(0, (this.lanePulseUntil[lane] - time) / 0.28);
      const intensity = held ? 1 : pulse;
      const laneGradient = ctx.createLinearGradient(x, 0, x, height);
      laneGradient.addColorStop(0, lane % 2 ? 'rgba(255,133,201,.055)' : 'rgba(113,221,255,.06)');
      laneGradient.addColorStop(0.7, lane % 2 ? 'rgba(255,133,201,.10)' : 'rgba(113,221,255,.11)');
      laneGradient.addColorStop(1, lane % 2 ? 'rgba(255,133,201,.17)' : 'rgba(113,221,255,.18)');
      ctx.fillStyle = laneGradient;
      ctx.fillRect(x + 1, 0, laneWidth - 2, height);
      if (intensity > 0.01) {
        ctx.fillStyle = `rgba(120,239,224,${0.07 + intensity * 0.19})`;
        ctx.fillRect(x + 1, 0, laneWidth - 2, height);
        ctx.shadowColor = '#78f3df';
        ctx.shadowBlur = 18 * intensity;
        ctx.strokeStyle = `rgba(126,255,234,${0.3 + intensity * 0.65})`;
        ctx.lineWidth = 2 + intensity * 2;
        ctx.beginPath(); ctx.moveTo(x + 1, 0); ctx.lineTo(x + 1, height); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = 'rgba(189,204,255,.22)';
      ctx.lineWidth = lane === 0 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(189,204,255,.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left + playableWidth, 0); ctx.lineTo(left + playableWidth, height); ctx.stroke();

    // Moving half-beat guides help players anticipate the rhythm without distracting from notes.
    const firstBeat = Math.floor((time - 1.4) / (beatDuration / 2));
    for (let beatIndex = firstBeat; beatIndex < firstBeat + 22; beatIndex += 1) {
      const beatTime = 1.4 + beatIndex * (beatDuration / 2);
      const y = targetY - (beatTime - time) * pixelsPerSecond;
      if (y < 0 || y > targetY) continue;
      const major = beatIndex % 2 === 0;
      ctx.strokeStyle = major ? 'rgba(194,199,255,.17)' : 'rgba(194,199,255,.075)';
      ctx.lineWidth = major ? 1.2 : 0.7;
      ctx.setLineDash(major ? [] : [3, 8]);
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + playableWidth, y); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Beat judgement line with a wide illuminated strike zone.
    const strike = ctx.createLinearGradient(left, 0, left + playableWidth, 0);
    strike.addColorStop(0, '#7cf6e0'); strike.addColorStop(0.48, '#c9c0ff'); strike.addColorStop(1, '#ff9fce');
    ctx.save();
    ctx.shadowColor = '#9fafff'; ctx.shadowBlur = 26;
    ctx.strokeStyle = 'rgba(255,255,255,.17)'; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(left, targetY); ctx.lineTo(left + playableWidth, targetY); ctx.stroke();
    ctx.strokeStyle = strike; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(left, targetY); ctx.lineTo(left + playableWidth, targetY); ctx.stroke();
    ctx.restore();

    // Draw slide paths first, so note heads remain crisp above the track ribbon.
    for (const note of this.notes) {
      if (note.done || note.type !== 'slide' || note.endTime === undefined || note.endLane === undefined) continue;
      const startY = note.started ? targetY : targetY - (note.time - time) * pixelsPerSecond;
      const endY = targetY - (note.endTime - time) * pixelsPerSecond;
      if (Math.max(startY, endY) < -60 || Math.min(startY, endY) > height + 60) continue;
      const startX = left + laneWidth * (note.lane + 0.5);
      const endX = left + laneWidth * (note.endLane + 0.5);
      const ribbon = ctx.createLinearGradient(startX, startY, endX, endY);
      ribbon.addColorStop(0, 'rgba(255,218,130,.88)'); ribbon.addColorStop(1, 'rgba(255,128,203,.92)');
      ctx.save();
      ctx.strokeStyle = 'rgba(255,190,116,.18)'; ctx.lineWidth = Math.max(17, laneWidth * 0.32); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo((startX + endX) / 2, (startY + endY) / 2 - 24, endX, endY); ctx.stroke();
      ctx.strokeStyle = ribbon; ctx.lineWidth = Math.max(7, laneWidth * 0.13); ctx.setLineDash([12, 8]);
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo((startX + endX) / 2, (startY + endY) / 2 - 24, endX, endY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff2d0'; ctx.beginPath(); ctx.arc(endX, endY, 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Simultaneous note links show a chord as one intentional pattern.
    const visibleChords = new Map<number, number[]>();
    for (const note of this.notes) {
      if (note.done) continue;
      const list = visibleChords.get(note.time) || [];
      list.push(note.lane);
      visibleChords.set(note.time, list);
    }
    for (const [noteTime, lanes] of visibleChords) {
      if (lanes.length < 2) continue;
      const y = targetY - (noteTime - time) * pixelsPerSecond;
      if (y < -40 || y > targetY + 8) continue;
      const sorted = [...lanes].sort((a, b) => a - b);
      ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(left + laneWidth * (sorted[0] + 0.5), y - 17); ctx.lineTo(left + laneWidth * (sorted[sorted.length - 1] + 0.5), y - 17); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Clear note grammar: tap / hold / slide / flick / special each has a distinct silhouette and label.
    for (const note of this.notes) {
      if (note.done && (!note.effectUntil || note.effectUntil < time)) continue;
      const y = note.started ? targetY : targetY - (note.time - time) * pixelsPerSecond;
      if (y < -100 || y > height + 80) continue;
      const laneX = left + laneWidth * note.lane;
      const centerX = laneX + laneWidth / 2;
      const widthHead = Math.max(36, Math.min(laneWidth * 0.74, 110));
      let color = '#e7f2ff';
      if (note.type === 'hold') color = '#65f2df';
      if (note.type === 'slide') color = '#ffd17d';
      if (note.type === 'flick') color = '#ff91c8';
      if (note.type === 'special') color = '#c6a2ff';

      if (note.type === 'hold' && note.endTime !== undefined) {
        const tailY = targetY - (note.endTime - time) * pixelsPerSecond;
        const top = Math.min(y, tailY);
        const tailHeight = Math.max(4, Math.abs(y - tailY));
        const tail = ctx.createLinearGradient(0, top, 0, top + tailHeight);
        tail.addColorStop(0, 'rgba(97,255,228,.83)'); tail.addColorStop(1, 'rgba(57,173,206,.24)');
        ctx.save();
        ctx.shadowColor = '#57f5e0'; ctx.shadowBlur = 15;
        ctx.fillStyle = tail;
        ctx.beginPath(); ctx.roundRect(centerX - widthHead * 0.22, top, widthHead * 0.44, tailHeight, 9); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#eafff9'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HOLD', centerX, Math.max(12, Math.min(height - 8, tailY - 10)));
      }

      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = note.type === 'special' ? 25 : 17;
      if (note.type === 'flick') {
        ctx.fillStyle = 'rgba(255,145,200,.20)';
        ctx.beginPath(); ctx.roundRect(centerX - widthHead * 0.54, y - 27, widthHead * 1.08, 50, 15); ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(centerX, y - 25); ctx.lineTo(centerX + 21, y - 2); ctx.lineTo(centerX + 9, y - 2); ctx.lineTo(centerX + 9, y + 19); ctx.lineTo(centerX - 9, y + 19); ctx.lineTo(centerX - 9, y - 2); ctx.lineTo(centerX - 21, y - 2); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#48263e'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('FLICK ↑', centerX, y + 37);
      } else if (note.type === 'special') {
        ctx.fillStyle = 'rgba(198,162,255,.18)'; ctx.beginPath(); ctx.arc(centerX, y, 27, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(centerX, y - 23); ctx.lineTo(centerX + 23, y); ctx.lineTo(centerX, y + 23); ctx.lineTo(centerX - 23, y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = '#38264e'; ctx.font = '900 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BURST', centerX, y + 3);
      } else {
        const headWidth = note.type === 'hold' ? widthHead * 0.84 : widthHead;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(centerX - headWidth / 2, y - 13, headWidth, 26, 10); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(24,31,53,.72)'; ctx.beginPath(); ctx.roundRect(centerX - headWidth / 2 + 4, y - 9, headWidth - 8, 18, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(note.type === 'hold' ? 'HOLD' : 'TAP', centerX, y + 3);
      }
      ctx.restore();

      if (note.type === 'slide' && note.endTime !== undefined && note.endLane !== undefined) {
        ctx.fillStyle = '#fff2cc'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TRACE →', centerX, y - 22);
      }
      if (note.started && (note.type === 'hold' || note.type === 'slide')) {
        const requiredLane = note.type === 'slide' ? (note.endLane ?? note.lane) : note.lane;
        const isMaintained = this.laneHeld(requiredLane);
        const status = note.type === 'hold'
          ? (isMaintained ? 'HOLDING' : 'KEEP PRESSING')
          : (isMaintained ? 'TRACE LOCKED' : 'MOVE →');
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '900 10px sans-serif';
        ctx.fillStyle = isMaintained ? '#9dffe9' : '#ffe09b';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillText(status, centerX, targetY + 29);
        ctx.restore();
      }
    }

    // Pointer/touch feedback: large ripple, crosshair and a clear lane flash.
    for (const effect of this.inputEffects) {
      const remaining = Math.max(0, (effect.until - time) / 0.52);
      const age = 1 - remaining;
      ctx.save();
      ctx.globalAlpha = Math.max(0, remaining);
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2.5 - age;
      ctx.shadowColor = effect.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, 9 + age * 54, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(effect.x, effect.y, 3 + age * 17, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(effect.x - 31, effect.y); ctx.lineTo(effect.x + 31, effect.y); ctx.moveTo(effect.x, effect.y - 31); ctx.lineTo(effect.x, effect.y + 31); ctx.stroke();
      if (effect.kind === 'flick') {
        ctx.fillStyle = '#fff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('FLICK!', effect.x, effect.y - 42 - age * 12);
      }
      ctx.restore();
    }
    this.inputEffects = this.inputEffects.filter((effect) => effect.until > time);

    for (const trail of this.trailEffects) {
      const alpha = Math.max(0, (trail.until - time) / 0.2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = trail.color;
      ctx.beginPath(); ctx.arc(trail.x, trail.y, 3 + alpha * 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.trailEffects = this.trailEffects.filter((trail) => trail.until > time);

    for (const particle of this.particles) {
      const remaining = Math.max(0, (particle.until - time) / 0.42);
      const age = 1 - remaining;
      ctx.save(); ctx.globalAlpha = remaining; ctx.strokeStyle = particle.color; ctx.lineWidth = 2.4;
      ctx.shadowColor = particle.color; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, 13 + age * 43, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        const inner = 17 + age * 7; const outer = 26 + age * 22;
        ctx.beginPath(); ctx.moveTo(particle.x + Math.cos(angle) * inner, particle.y + Math.sin(angle) * inner); ctx.lineTo(particle.x + Math.cos(angle) * outer, particle.y + Math.sin(angle) * outer); ctx.stroke();
      }
      ctx.restore();
    }
    this.particles = this.particles.filter((particle) => particle.until > time);

    // Large, legible lane controls at the bottom edge of the playfield.
    const labels = this.laneCount === 4 ? ['D', 'F', 'J', 'K'] : ['F', 'J'];
    ctx.textAlign = 'center';
    for (let lane = 0; lane < this.laneCount; lane += 1) {
      const center = left + laneWidth * (lane + 0.5);
      const active = this.laneHeld(lane) || this.lanePulseUntil[lane] > time;
      const boxWidth = Math.min(66, laneWidth * 0.52);
      ctx.fillStyle = active ? 'rgba(125,245,222,.30)' : 'rgba(255,255,255,.09)';
      ctx.strokeStyle = active ? '#8ffff0' : 'rgba(221,226,255,.34)';
      ctx.lineWidth = active ? 2.5 : 1.2;
      ctx.beginPath(); ctx.roundRect(center - boxWidth / 2, height - 43, boxWidth, 30, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? '#f7fffd' : 'rgba(230,235,255,.73)';
      ctx.font = '900 13px sans-serif'; ctx.fillText(labels[lane], center, height - 23);
    }
    ctx.font = '800 10px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(222,229,255,.56)';
    ctx.fillText('TAP · HOLD / KEEP · TRACE / MOVE · FLICK / SWIPE', left + 2, 18);
    ctx.textAlign = 'right'; ctx.fillText(`${Math.max(0, this.duration - time).toFixed(1)}s`, left + playableWidth, 18);
  }

  private finish(time: number) {
    if (this.ended) return;
    this.ended = true;
    cancelAnimationFrame(this.raf);
    this.options.onUpdate({ ...this.stats }, time);
    const rank = this.stats.accuracy >= 99.5 ? 'S+' : this.stats.accuracy >= 97 ? 'S' : this.stats.accuracy >= 92 ? 'A' : this.stats.accuracy >= 85 ? 'B' : this.stats.accuracy >= 70 ? 'C' : 'D';
    this.options.onFinish({
      ...this.stats,
      rank,
      fullCombo: this.stats.miss === 0 && this.stats.bad === 0,
      allPerfect: this.stats.perfect === this.stats.total,
      songId: this.song.id,
      difficulty: this.difficulty,
      durationPlayed: time,
    });
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown', this.onPointerDownBound);
    this.canvas.removeEventListener('pointermove', this.onPointerMoveBound);
    this.canvas.removeEventListener('pointerup', this.onPointerUpBound);
    this.canvas.removeEventListener('pointercancel', this.onPointerUpBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.resizeObserver.disconnect();
    this.transport.dispose();
  }
}
