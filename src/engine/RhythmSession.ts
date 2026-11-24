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
  private trackDuration = 0;
  private disposed = false;
  private audioBuffers = new Map<string, AudioBuffer>();

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

  get duration() { return this.trackDuration; }

  private async loadTrack(src: string) {
    const cached = this.audioBuffers.get(src);
    if (cached) return cached;
    const response = await fetch(src);
    if (!response.ok) throw new Error(`음원 파일을 불러오지 못했습니다. (${response.status})`);
    const bytes = await response.arrayBuffer();
    const decoded = await this.context.decodeAudioData(bytes);
    this.audioBuffers.set(src, decoded);
    return decoded;
  }

  async play(song: Song) {
    // Resume immediately from the user's start gesture, then decode any uploaded MP3.
    await this.context.resume();
    this.stopScheduled();
    const trackBuffer = song.audioSrc ? await this.loadTrack(song.audioSrc) : null;
    this.startAt = this.context.currentTime + 0.38;
    if (trackBuffer) {
      this.trackDuration = trackBuffer.duration;
      const source = this.context.createBufferSource();
      source.buffer = trackBuffer;
      source.connect(this.master);
      this.track(source);
      // The decoded MP3 and chart use the same clock origin. audioLeadIn is
      // the first musical beat inside the file, not a second playback delay.
      source.start(this.startAt);
    } else {
      // Procedural original demo tracks continue to use the Web Audio timeline.
      this.scheduleMusic(song, this.startAt + 1.4);
    }
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

const KEY_MAP: Record<string, number> = { s: 0, d: 1, f: 2, j: 3, k: 4, l: 5 };

export class RhythmSession {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private song: Song;
  private difficulty: DifficultyId;
  private options: SessionOptions;
  private transport: AudioTransport;
  private notes: RuntimeNote[];
  private laneCount: number;
  private chartStart: number;
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
    this.chartStart = song.audioSrc ? (song.audioLeadIn ?? 0) : 1.4;
    const chart = generateChart(song, difficulty, this.chartStart);
    this.notes = chart.notes.map((note) => ({ ...note, started: false, done: false }));
    this.laneCount = chart.laneCount;
    this.lanePulseUntil = Array.from({ length: this.laneCount }, () => 0);
    this.duration = song.audioSrc ? song.duration : chart.duration;
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
    if (this.song.audioSrc && this.transport.duration > 0) this.duration = this.transport.duration;
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

  private roadHalfWidthAt(y: number) {
    // The stage may have depth, but the input field must not.  Keeping every
    // lane the same width prevents notes from scaling while travelling and
    // makes touch targets identical from top to judgement line.
    void y;
    return Math.min(this.width * 0.46, 360);
  }

  private laneBoundaryX(boundary: number, y: number) {
    const half = this.roadHalfWidthAt(y);
    return this.width * 0.5 - half + (half * 2 * boundary) / this.laneCount;
  }

  private laneAt(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = Math.max(0, Math.min(this.height, clientY - rect.top));
    const half = this.roadHalfWidthAt(y);
    const left = this.width * 0.5 - half;
    const roadWidth = half * 2;
    return Math.max(0, Math.min(this.laneCount - 1, Math.floor(((x - left) / roadWidth) * this.laneCount)));
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
    const lane = this.laneAt(event.clientX, event.clientY);
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
    const lane = this.laneAt(event.clientX, event.clientY);
    this.pointerLanes.set(event.pointerId, lane);
    const origin = this.pointerOrigins.get(event.pointerId);
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) {
      this.trailEffects.push({ x: localX, y: localY, until: this.songTime() + 0.2, color: '#ff9dce' });
      if (this.trailEffects.length > 36) this.trailEffects.shift();
    }
    const isUpwardFlick = dy < -18 && Math.abs(dy) > Math.abs(dx) * 0.75;
    if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
      const time = this.songTime();
      const nearest = isUpwardFlick ? this.notes.find((note) => !note.done && !note.started && note.type === 'flick' && (note.lane === lane || note.lane === this.laneAt(origin.x, origin.y)) && Math.abs(time - note.time - this.options.timingOffset / 1000) <= 0.22) : undefined;
      if (nearest) {
        this.hitNote(nearest, this.gradeFor(time - nearest.time - this.options.timingOffset / 1000));
        this.addInputFeedback(nearest.lane, localX, localY, 'flick');
      } else if (lane !== this.laneAt(origin.x, origin.y)) {
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
    const lane = KEY_MAP[event.key.toLowerCase()];
    if (lane === undefined || lane >= this.laneCount) return;
    event.preventDefault();
    this.keyLanes.add(lane);
    this.addInputFeedback(lane, this.laneCenter(lane), this.height * 0.81, 'key');
    this.pressLane(lane, true);
  }

  private onKeyUp(event: KeyboardEvent) {
    const lane = KEY_MAP[event.key.toLowerCase()];
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
    if (note.type === 'hold') {
      note.started = true;
      note.startGrade = grade;
      note.effectUntil = this.songTime() + 0.22;
      this.addInputFeedback(note.lane, this.laneCenter(note.lane), this.height * 0.81, 'touch');
      return;
    }
    note.done = true;
    note.effectUntil = this.songTime() + 0.3;
    this.record(grade);
    const laneX = this.laneCenter(note.lane);
    this.particles.push({ x: laneX, y: this.height * 0.81, until: this.songTime() + 0.42, color: grade === 'PERFECT' ? '#fff4b8' : '#80e8ff' });
    this.addInputFeedback(note.lane, laneX, this.height * 0.81, note.type === 'flick' ? 'flick' : 'touch');
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
    const targetY = this.height * 0.81;
    return (this.laneBoundaryX(lane, targetY) + this.laneBoundaryX(lane + 1, targetY)) / 2;
  }

  private processNotes(time: number) {
    const offset = this.options.timingOffset / 1000;
    for (const note of this.notes) {
      if (note.done) continue;
      if (note.started && note.endTime !== undefined) {
        if (time >= note.endTime + offset + 0.205) {
          const targetLane = note.lane;
          const held = this.laneHeld(targetLane);
          note.done = true;
          const grade = held ? (note.startGrade || 'GOOD') : 'MISS';
          this.record(grade);
          note.effectUntil = time + 0.25;
          this.particles.push({ x: this.laneCenter(targetLane), y: this.height * 0.81, until: time + 0.42, color: held ? '#83f1c4' : '#ff758f' });
          this.addInputFeedback(targetLane, this.laneCenter(targetLane), this.height * 0.81, held ? 'touch' : 'flick');
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
    const finishGrace = this.song.audioSrc ? 0.3 : 2.4;
    if (time > this.duration + finishGrace && this.notes.every((note) => note.done)) {
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

    // Night-time city stage, floating music panels, and distant spotlights.
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#07142f');
    sky.addColorStop(0.46, '#111b43');
    sky.addColorStop(0.76, '#201b4c');
    sky.addColorStop(1, '#43265f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const skylineY = height * 0.56;
    ctx.fillStyle = 'rgba(8,17,47,.72)';
    for (let index = 0; index < 34; index += 1) {
      const x = (index / 34) * width;
      const buildingWidth = width / 42 + (index % 4) * 2;
      const buildingHeight = height * (0.07 + ((index * 17) % 13) / 100);
      ctx.fillRect(x, skylineY - buildingHeight, buildingWidth, buildingHeight + height * 0.16);
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 2; col += 1) {
          const lightX = x + 3 + col * Math.max(5, buildingWidth * 0.42);
          const lightY = skylineY - buildingHeight + 7 + row * 11;
          ctx.fillStyle = (index + row + col) % 3 === 0 ? 'rgba(76,219,226,.22)' : 'rgba(247,130,204,.16)';
          ctx.fillRect(lightX, lightY, 2, 4);
        }
      }
      ctx.fillStyle = 'rgba(8,17,47,.72)';
    }

    // Soft clouds and star points add depth behind the highway.
    for (let cloud = 0; cloud < 5; cloud += 1) {
      const cx = width * (0.08 + cloud * 0.21);
      const cy = height * (0.14 + (cloud % 2) * 0.12);
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#7772d9';
      ctx.beginPath();
      ctx.arc(cx, cy, width * 0.035, Math.PI, 0);
      ctx.arc(cx + width * 0.025, cy + 2, width * 0.026, Math.PI, 0);
      ctx.arc(cx - width * 0.026, cy + 5, width * 0.02, Math.PI, 0);
      ctx.fill();
      ctx.restore();
    }
    for (let index = 0; index < 72; index += 1) {
      const x = (index * 137.31 + 23) % width;
      const y = (index * 83.17 + 11) % (height * 0.73);
      const flicker = 0.28 + (Math.sin(time * 2.3 + index * 1.7) + 1) * 0.22;
      ctx.fillStyle = `rgba(215,235,255,${flicker})`;
      ctx.beginPath();
      ctx.arc(x, y, index % 8 === 0 ? 1.7 : 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Keep the scenery behind the playable field dark and quiet for contrast.
    for (let beam = 0; beam < 7; beam += 1) {
      const originX = width * (0.04 + beam * 0.15);
      ctx.save();
      ctx.globalAlpha = 0.025 + (beam % 3) * 0.008;
      ctx.strokeStyle = beam % 2 ? '#65dbe5' : '#ff91d1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(width * 0.5 + (beam - 3) * width * 0.012, height * 0.03);
      ctx.lineTo(originX, height * 0.94);
      ctx.stroke();
      ctx.restore();
    }

    const targetY = height * 0.81;
    const roadTopY = height * 0.155;
    const roadBottomY = height * 1.03;
    const topHalf = this.roadHalfWidthAt(roadTopY);
    const bottomHalf = this.roadHalfWidthAt(height);
    const road = ctx.createLinearGradient(0, roadTopY, 0, height);
    road.addColorStop(0, 'rgba(12,22,60,.68)');
    road.addColorStop(0.72, 'rgba(22,22,66,.82)');
    road.addColorStop(1, 'rgba(68,33,93,.82)');
    ctx.beginPath();
    ctx.moveTo(width * 0.5 - topHalf, roadTopY);
    ctx.lineTo(width * 0.5 + topHalf, roadTopY);
    ctx.lineTo(width * 0.5 + bottomHalf, roadBottomY);
    ctx.lineTo(width * 0.5 - bottomHalf, roadBottomY);
    ctx.closePath();
    ctx.fillStyle = road;
    ctx.fill();

    // Six fixed-width lanes. Background depth is decorative only; gameplay
    // geometry never uses perspective or scale transforms.
    for (let lane = 0; lane < this.laneCount; lane += 1) {
      const color = lane % 2 === 0 ? 'rgba(66,183,220,.12)' : 'rgba(176,105,220,.105)';
      ctx.beginPath();
      ctx.moveTo(this.laneBoundaryX(lane, roadTopY), roadTopY);
      ctx.lineTo(this.laneBoundaryX(lane + 1, roadTopY), roadTopY);
      ctx.lineTo(this.laneBoundaryX(lane + 1, roadBottomY), roadBottomY);
      ctx.lineTo(this.laneBoundaryX(lane, roadBottomY), roadBottomY);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Fixed lane rails and a time-based beat grid.
    ctx.save();
    for (let boundary = 0; boundary <= this.laneCount; boundary += 1) {
      ctx.beginPath();
      ctx.moveTo(this.laneBoundaryX(boundary, roadTopY), roadTopY);
      ctx.lineTo(this.laneBoundaryX(boundary, roadBottomY), roadBottomY);
      ctx.strokeStyle = boundary === 0 || boundary === this.laneCount ? 'rgba(220,226,255,.68)' : 'rgba(203,215,255,.38)';
      ctx.lineWidth = boundary === 0 || boundary === this.laneCount ? 2 : 1.25;
      ctx.stroke();
    }
    const beatDuration = 60 / this.song.bpm;
    const pixelsPerSecond = Math.max(250, height * 0.48) * this.options.noteSpeed;
    const yForTime = (noteTime: number) => targetY - (noteTime - time) * pixelsPerSecond;
    if (this.options.laneGuide) {
      const firstBeat = Math.floor((time - this.chartStart) / (beatDuration / 2));
      for (let beatIndex = firstBeat; beatIndex < firstBeat + 28; beatIndex += 1) {
        const beatTime = this.chartStart + beatIndex * (beatDuration / 2);
        const y = yForTime(beatTime);
        if (y < roadTopY || y > roadBottomY) continue;
        ctx.beginPath();
        ctx.moveTo(this.laneBoundaryX(0, y), y);
        ctx.lineTo(this.laneBoundaryX(this.laneCount, y), y);
        const major = beatIndex % 2 === 0;
        ctx.strokeStyle = major ? 'rgba(208,217,255,.23)' : 'rgba(208,217,255,.095)';
        ctx.lineWidth = major ? 1.3 : 0.7;
        ctx.setLineDash(major ? [] : [3, 7]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Long notes are a solid fixed-width ribbon with both ends in the same lane.
    for (const note of this.notes) {
      if (note.done || note.type !== 'hold' || note.endTime === undefined) continue;
      const headY = note.started ? targetY : yForTime(note.time);
      const tailY = yForTime(note.endTime);
      const top = Math.max(roadTopY - 30, Math.min(headY, tailY));
      const bottom = Math.min(height + 30, Math.max(headY, tailY));
      if (bottom < roadTopY || top > roadBottomY) continue;
      const topLeft = this.laneBoundaryX(note.lane, top) + 2;
      const topRight = this.laneBoundaryX(note.lane + 1, top) - 2;
      const bottomLeft = this.laneBoundaryX(note.lane, bottom) + 2;
      const bottomRight = this.laneBoundaryX(note.lane + 1, bottom) - 2;
      const holdGradient = ctx.createLinearGradient(0, top, 0, bottom);
      holdGradient.addColorStop(0, 'rgba(126,255,232,.28)');
      holdGradient.addColorStop(0.55, 'rgba(91,224,219,.58)');
      holdGradient.addColorStop(1, 'rgba(70,175,222,.82)');
      ctx.save();
      ctx.shadowColor = '#62f6e3';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(topLeft, top);
      ctx.lineTo(topRight, top);
      ctx.lineTo(bottomRight, bottom);
      ctx.lineTo(bottomLeft, bottom);
      ctx.closePath();
      ctx.fillStyle = holdGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(226,255,251,.82)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      if (bottom - top > 40) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `900 ${Math.max(8, Math.min(13, width / 90))}px sans-serif`;
        ctx.fillStyle = 'rgba(243,255,255,.9)';
        ctx.shadowColor = '#4eead9';
        ctx.shadowBlur = 10;
        ctx.fillText('LONG', this.laneCenter(note.lane), (top + bottom) / 2);
        ctx.restore();
      }
    }

    // The judgement bar sits in front of the note highway.
    const hitLeft = this.laneBoundaryX(0, targetY);
    const hitRight = this.laneBoundaryX(this.laneCount, targetY);
    ctx.save();
    ctx.shadowColor = '#e68dff';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = 'rgba(255,255,255,.24)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(hitLeft, targetY);
    ctx.lineTo(hitRight, targetY);
    ctx.stroke();
    const judgement = ctx.createLinearGradient(hitLeft, targetY, hitRight, targetY);
    judgement.addColorStop(0, '#ff83c9');
    judgement.addColorStop(0.5, '#d58dff');
    judgement.addColorStop(1, '#a8a0ff');
    ctx.strokeStyle = judgement;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hitLeft, targetY);
    ctx.lineTo(hitRight, targetY);
    ctx.stroke();
    ctx.restore();

    // Keyboard guide is attached to the judgement edge, never mixed into HUD.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.max(9, Math.min(13, width / 75))}px ui-monospace, monospace`;
    for (let lane = 0; lane < this.laneCount; lane += 1) {
      const center = this.laneCenter(lane);
      ctx.fillStyle = 'rgba(230,237,255,.5)';
      ctx.fillText(['S', 'D', 'F', 'J', 'K', 'L'][lane], center, Math.min(height - 14, targetY + 30));
    }
    ctx.restore();

    // Standard notes and flicks occupy the full fixed width of their lane.
    for (const note of this.notes) {
      if (note.type === 'hold' || (note.done && (!note.effectUntil || note.effectUntil < time))) continue;
      const y = yForTime(note.time);
      if (y < roadTopY - 50 || y > height + 50) continue;
      const top = y - 13;
      const bottom = y + 13;
      const leftTop = this.laneBoundaryX(note.lane, top) + 2;
      const rightTop = this.laneBoundaryX(note.lane + 1, top) - 2;
      const leftBottom = this.laneBoundaryX(note.lane, bottom) + 2;
      const rightBottom = this.laneBoundaryX(note.lane + 1, bottom) - 2;
      const flick = note.type === 'flick';
      const noteGradient = ctx.createLinearGradient(0, top, 0, bottom);
      if (flick) {
        noteGradient.addColorStop(0, '#ffd4ef');
        noteGradient.addColorStop(0.45, '#ff8dce');
        noteGradient.addColorStop(1, '#e65cae');
      } else {
        noteGradient.addColorStop(0, '#f4ffff');
        noteGradient.addColorStop(0.45, '#9df5ef');
        noteGradient.addColorStop(1, '#62c8ed');
      }
      ctx.save();
      ctx.shadowColor = flick ? '#ff77c4' : '#7ceee9';
      ctx.shadowBlur = note.done ? 4 : 18;
      ctx.beginPath();
      ctx.moveTo(leftTop, top);
      ctx.lineTo(rightTop, top);
      ctx.lineTo(rightBottom, bottom);
      ctx.lineTo(leftBottom, bottom);
      ctx.closePath();
      ctx.fillStyle = noteGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.93)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (flick) {
        const center = this.laneCenter(note.lane);
        const iconSize = Math.max(14, Math.min(24, (rightBottom - leftBottom) * 0.23));
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff7fc';
        ctx.lineWidth = Math.max(2.5, iconSize * 0.16);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const offset of [iconSize * 0.22, -iconSize * 0.2]) {
          ctx.beginPath();
          ctx.moveTo(center - iconSize * 0.42, y + offset + iconSize * 0.18);
          ctx.lineTo(center, y + offset - iconSize * 0.26);
          ctx.lineTo(center + iconSize * 0.42, y + offset + iconSize * 0.18);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Held lanes glow through the whole perspective column.
    for (let lane = 0; lane < this.laneCount; lane += 1) {
      const pulse = Math.max(0, (this.lanePulseUntil[lane] - time) / 0.28);
      const intensity = this.laneHeld(lane) ? 1 : pulse;
      if (intensity <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = 0.12 + intensity * 0.18;
      ctx.fillStyle = '#8effe8';
      ctx.beginPath();
      ctx.moveTo(this.laneBoundaryX(lane, roadTopY), roadTopY);
      ctx.lineTo(this.laneBoundaryX(lane + 1, roadTopY), roadTopY);
      ctx.lineTo(this.laneBoundaryX(lane + 1, roadBottomY), roadBottomY);
      ctx.lineTo(this.laneBoundaryX(lane, roadBottomY), roadBottomY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Input ripples, flick trails, and judgement sparkles.
    for (const effect of this.inputEffects) {
      const remaining = Math.max(0, (effect.until - time) / 0.52);
      const age = 1 - remaining;
      ctx.save();
      ctx.globalAlpha = Math.max(0, remaining);
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2.5 - age;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 9 + age * 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 3 + age * 17, 0, Math.PI * 2);
      ctx.stroke();
      if (effect.kind === 'flick') {
        ctx.fillStyle = '#fff';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FLICK!', effect.x, effect.y - 42 - age * 12);
      }
      ctx.restore();
    }
    this.inputEffects = this.inputEffects.filter((effect) => effect.until > time);

    for (const trail of this.trailEffects) {
      const alpha = Math.max(0, (trail.until - time) / 0.2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = trail.color;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 3 + alpha * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.trailEffects = this.trailEffects.filter((trail) => trail.until > time);

    for (const particle of this.particles) {
      const remaining = Math.max(0, (particle.until - time) / 0.42);
      const age = 1 - remaining;
      ctx.save();
      ctx.globalAlpha = remaining;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 13 + age * 43, 0, Math.PI * 2);
      ctx.stroke();
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        const inner = 17 + age * 7;
        const outer = 26 + age * 22;
        ctx.beginPath();
        ctx.moveTo(particle.x + Math.cos(angle) * inner, particle.y + Math.sin(angle) * inner);
        ctx.lineTo(particle.x + Math.cos(angle) * outer, particle.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.restore();
    }
    this.particles = this.particles.filter((particle) => particle.until > time);
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
