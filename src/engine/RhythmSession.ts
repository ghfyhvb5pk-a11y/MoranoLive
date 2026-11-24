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
    const playableLeft = this.width * 0.08;
    const playableWidth = this.width * 0.84;
    return Math.max(0, Math.min(this.laneCount - 1, Math.floor(((x - playableLeft) / playableWidth) * this.laneCount)));
  }

  private onPointerDown(event: PointerEvent) {
    if (this.paused || !this.started || this.ended) return;
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    const lane = this.laneAt(event.clientX);
    this.pointerLanes.set(event.pointerId, lane);
    this.pointerOrigins.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.pressLane(lane, false);
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.pointerLanes.has(event.pointerId)) return;
    const lane = this.laneAt(event.clientX);
    this.pointerLanes.set(event.pointerId, lane);
    const origin = this.pointerOrigins.get(event.pointerId);
    if (origin && Math.abs(event.clientY - origin.y) > 26) {
      const nearest = this.notes.find((note) => !note.done && !note.started && note.type === 'flick' && note.lane === lane && Math.abs(this.songTime() - note.time) <= 0.2);
      if (nearest) this.hitNote(nearest, this.gradeFor(this.songTime() - nearest.time - this.options.timingOffset / 1000));
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
      return;
    }
    note.done = true;
    note.effectUntil = this.songTime() + 0.3;
    this.record(grade);
    const laneX = this.laneCenter(note.lane);
    this.particles.push({ x: laneX, y: this.height * 0.82, until: this.songTime() + 0.3, color: grade === 'PERFECT' ? '#fff4b8' : '#80e8ff' });
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
    const left = this.width * 0.08;
    const playableWidth = this.width * 0.84;
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
          this.particles.push({ x: this.laneCenter(targetLane), y: this.height * 0.82, until: time + 0.28, color: held ? '#83f1c4' : '#ff758f' });
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
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#17182d');
    background.addColorStop(1, '#252040');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    for (let index = 0; index < 32; index += 1) {
      const x = (index * 97.31) % width;
      const y = (index * 71.7) % height;
      ctx.fillStyle = `rgba(205,220,255,${0.035 + (index % 4) * 0.012})`;
      ctx.beginPath();
      ctx.arc(x, y, (index % 3) + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const left = width * 0.08;
    const laneWidth = width * 0.84 / this.laneCount;
    const targetY = height * 0.82;
    for (let lane = 0; lane < this.laneCount; lane += 1) {
      const x = left + lane * laneWidth;
      ctx.fillStyle = lane % 2 === 0 ? 'rgba(126,151,255,0.055)' : 'rgba(250,160,205,0.045)';
      ctx.fillRect(x, 0, laneWidth, height);
      ctx.strokeStyle = 'rgba(208,218,255,0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.beginPath(); ctx.moveTo(left + laneWidth * this.laneCount, 0); ctx.lineTo(left + laneWidth * this.laneCount, height); ctx.stroke();

    // Beat rail and judgment line.
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.setLineDash([5, 8]);
    ctx.beginPath(); ctx.moveTo(left, targetY - 2); ctx.lineTo(left + laneWidth * this.laneCount, targetY - 2); ctx.stroke();
    ctx.setLineDash([]);
    const lineGradient = ctx.createLinearGradient(left, 0, left + laneWidth * this.laneCount, 0);
    lineGradient.addColorStop(0, '#8be2d2'); lineGradient.addColorStop(0.5, '#d2c4ff'); lineGradient.addColorStop(1, '#ffb2cf');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#aabaff'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(left, targetY); ctx.lineTo(left + laneWidth * this.laneCount, targetY); ctx.stroke();
    ctx.shadowBlur = 0;

    const pixelsPerSecond = 340 * this.options.noteSpeed;
    for (const note of this.notes) {
      if (note.done && (!note.effectUntil || note.effectUntil < time)) continue;
      const y = targetY - (note.time - time) * pixelsPerSecond;
      if (y < -70 || y > height + 60) continue;
      const laneX = left + laneWidth * note.lane;
      const centerX = laneX + laneWidth / 2;
      if (note.type === 'hold' && note.endTime) {
        const tailY = targetY - (note.endTime - time) * pixelsPerSecond;
        ctx.fillStyle = 'rgba(111,213,208,0.35)';
        ctx.fillRect(centerX - Math.min(13, laneWidth * 0.1), Math.min(y, tailY), Math.min(26, laneWidth * 0.2), Math.abs(y - tailY));
      }
      if (note.type === 'slide' && note.endTime !== undefined && note.endLane !== undefined) {
        const endX = left + laneWidth * (note.endLane + 0.5);
        const endY = targetY - (note.endTime - time) * pixelsPerSecond;
        ctx.strokeStyle = 'rgba(255,198,114,0.58)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(centerX, y); ctx.lineTo(endX, endY); ctx.stroke();
      }
      const color = note.type === 'flick' ? '#ff9bca' : note.type === 'hold' ? '#69e0ce' : note.type === 'slide' ? '#ffc978' : note.type === 'special' ? '#c9a6ff' : '#e8ecff';
      ctx.shadowColor = color; ctx.shadowBlur = note.type === 'special' ? 18 : 10;
      ctx.fillStyle = color;
      if (note.type === 'flick') {
        ctx.beginPath(); ctx.moveTo(centerX, y - 17); ctx.lineTo(centerX + 18, y + 9); ctx.lineTo(centerX, y + 3); ctx.lineTo(centerX - 18, y + 9); ctx.closePath(); ctx.fill();
      } else if (note.type === 'special') {
        ctx.beginPath(); ctx.moveTo(centerX, y - 17); ctx.lineTo(centerX + 17, y); ctx.lineTo(centerX, y + 17); ctx.lineTo(centerX - 17, y); ctx.closePath(); ctx.fill();
      } else {
        const radius = note.type === 'hold' ? 9 : 11;
        ctx.beginPath();
        ctx.roundRect(centerX - laneWidth * 0.28, y - radius, laneWidth * 0.56, radius * 2, 9);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (note.type === 'flick') {
        ctx.fillStyle = '#552d59'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('↑', centerX, y + 4);
      }
      if (note.type === 'special') {
        ctx.fillStyle = '#48396b'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('LIVE', centerX, y + 3);
      }
    }

    for (const particle of this.particles) {
      const remaining = Math.max(0, (particle.until - time) / 0.3);
      ctx.globalAlpha = remaining;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(particle.x, targetY, 18 + (1 - remaining) * 24, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    this.particles = this.particles.filter((particle) => particle.until > time);

    // Optional keyboard / lane input guide.
    if (this.options.laneGuide !== false) {
      ctx.font = '600 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(230,233,255,0.46)';
      const labels = this.laneCount === 4 ? ['D', 'F', 'J', 'K'] : ['F', 'J'];
      for (let lane = 0; lane < this.laneCount; lane += 1) {
        const center = left + laneWidth * (lane + 0.5);
        ctx.fillText(labels[lane], center, height - 15);
      }
    }
    ctx.font = '700 10px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(225,230,255,0.5)';
    ctx.fillText(`${Math.max(0, this.duration - time).toFixed(1)}s`, left, 22);
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
