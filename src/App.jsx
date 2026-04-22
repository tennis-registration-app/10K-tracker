import { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Check, X, ChevronLeft, ChevronRight, Dumbbell,
  Zap, Mountain, Coffee, Trophy, Target, Activity, Flag,
  ChevronDown, ChevronUp, AlertCircle, Hourglass,
} from 'lucide-react';

// =========================================================
// PLAN CONFIG
// =========================================================

const PLAN_START = new Date(2026, 3, 6); // Mon April 6, 2026 (month is 0-indexed)
const TOTAL_WEEKS = 30;
const STORAGE_KEY = 'workout-status';

const PHASES = [
  { num: 1, name: 'Threshold Foundation',     weeks: [1, 2, 3, 4, 5, 6],
    goal: 'Make 8:10–8:15 pace feel controlled and repeatable for 20+ minutes continuously.',
    checkpoint: '20 min continuous at 8:10–8:15, HR <168, no significant drift.',
    accent: '#d97706' },
  { num: 2, name: 'Race Durability',          weeks: [7, 8, 9, 10, 11, 12],
    goal: 'Sustain race-relevant pace under accumulating fatigue. Addresses the miles 4–6 fade.',
    checkpoint: '2 × 2 mi @ 8:00–8:05, 3 min recovery, HR controlled through Rep 2.',
    accent: '#ea580c' },
  { num: 3, name: 'Race-Specific Conversion', weeks: [13, 14, 15, 16, 17, 18],
    goal: 'Make 7:50 pace feel like 8:15 felt in Phase 1.',
    checkpoint: '3 × 2 mi @ 7:50–7:55 without fade in third rep.',
    accent: '#dc2626' },
  { num: 4, name: '5-Mile Prep + Taper',      weeks: [19, 20, 21, 22, 23, 24],
    goal: 'Convert Phase 3 fitness into a 5-mile race result. Use the race as calibration.',
    checkpoint: '5-mile race @ 7:50–7:55 (~39:10–39:35).',
    accent: '#b91c1c' },
  { num: 5, name: '10K Specific Block',       weeks: [25, 26, 27, 28, 29, 30],
    goal: 'Final conversion: 10K-specific work → taper → goal race.',
    checkpoint: '10K @ 7:45/mi (~48:00).',
    accent: '#7c2d12' },
];

const TYPE_META = {
  threshold: { label: 'Threshold',  icon: Target,    color: '#f59e0b' },
  speed:     { label: 'Speed',      icon: Zap,       color: '#fb923c' },
  racepace:  { label: 'Race Pace',  icon: Activity,  color: '#fb7185' },
  vo2:       { label: 'VO₂max',     icon: Zap,       color: '#ef4444' },
  long:      { label: 'Long Run',   icon: Mountain,  color: '#10b981' },
  easy:      { label: 'Easy',       icon: Activity,  color: '#64748b' },
  rest:      { label: 'Rest',       icon: Coffee,    color: '#525252' },
  race:      { label: 'Race',       icon: Trophy,    color: '#eab308' },
  strides:   { label: 'Strides',    icon: Zap,       color: '#f97316' },
  taper:     { label: 'Taper',      icon: Hourglass, color: '#a78bfa' },
};

// =========================================================
// THE PLAN (30 weeks)
// =========================================================

const D = (type, title, extras = {}) => ({ type, title, ...extras });

const WEEKS = [
  // ======== PHASE 1 ========
  { n: 1, phase: 1, days: {
    mon: D('rest', 'Rest or easy 30 min', { note: 'Optional easy jog or full rest.' }),
    tue: D('threshold', '3 × 8 min @ 8:15–8:20', { recovery: '2 min jog between reps', warmup: '1.5–2 mi easy (HR <135)', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi', { note: 'HR ceiling 140.' }),
    thu: D('speed', '6 × 90 sec @ 7:50–8:00', { recovery: '90 sec jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', note: 'HR ceiling 168–170 (GPS lags on short reps).', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '6 mi easy', { note: '10:30–11:00 pace, HR ≤140. First 1.5–2 mi as warmup.' }),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 2, phase: 1, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '3 × 9 min @ 8:15', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('speed', '6 × 90 sec @ 7:50–8:00', { recovery: '90 sec jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '6 mi easy', { note: '10:30–11:00 pace, HR ≤140.' }),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 3, phase: 1, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 14 min @ 8:10–8:15', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('speed', '5 × 2 min @ 7:45–7:55', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '6 mi easy', { note: '10:30–11:00 pace, HR ≤140.' }),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 4, phase: 1, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 16 min @ 8:10', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('speed', '5 × 2 min @ 7:45–7:55', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '7 mi with 1.5 mi finish @ 8:30–8:45', { note: 'Last 1.5 miles at 8:30–8:45. Start easy.' }),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 5, phase: 1, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '20 min continuous @ 8:10–8:15', { warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('speed', '4 × 3 min @ 7:45–7:50', { recovery: '2:30 jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '7 mi with 1.5 mi finish @ 8:30–8:45'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 6, phase: 1, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '22 min continuous @ 8:08–8:12', { warmup: '1.5–2 mi easy', cooldown: '1 mi easy', checkpoint: true, note: 'CHECKPOINT: Target 22 min at 8:08–8:12 with HR <168 and no drift.' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('speed', '4 × 3 min @ 7:45–7:50', { recovery: '2:30 jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '7 mi with 1.5 mi finish @ 8:30–8:45'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},

  // ======== PHASE 2 ========
  { n: 7, phase: 2, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 18 min @ 8:05–8:10', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('racepace', '4 × 1 mi @ 7:55–8:00', { recovery: '90 sec rest', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '8 mi with 2 mi finish @ 8:20–8:30'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 8, phase: 2, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '25 min continuous @ 8:05', { warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('racepace', '4 × 1 mi @ 7:55–8:00', { recovery: '90 sec rest', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '8 mi with 2 mi finish @ 8:20–8:30'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 9, phase: 2, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '3 × 10 min @ 8:00–8:05', { recovery: '90 sec jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('racepace', '3 × 1.5 mi @ 7:55–8:00', { recovery: '2 min rest', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '8 mi with 2 mi finish @ 8:20–8:30'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 10, phase: 2, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 15 min @ 8:00', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('racepace', '3 × 1.5 mi @ 7:55–8:00', { recovery: '2 min rest', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9 mi with 3 mi finish @ 8:15–8:25'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 11, phase: 2, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '30 min continuous @ 8:00–8:05', { warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('racepace', '2 × 2 mi @ 7:55–8:00', { recovery: '3 min rest', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9 mi with 3 mi finish @ 8:15–8:25'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 12, phase: 2, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 2 mi @ 8:00–8:05', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', checkpoint: true, note: 'CHECKPOINT: HR must stay controlled through Rep 2.' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('racepace', '2 × 2 mi @ 7:55–8:00', { recovery: '3 min rest', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9 mi with 3 mi finish @ 8:15–8:25'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},

  // ======== PHASE 3 ========
  { n: 13, phase: 3, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 15 min @ 7:55–8:00', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '5 × 3 min @ 7:20–7:30', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', note: 'HR will hit 170–176. Expected and appropriate.', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9–10 mi with 3 mi finish @ 8:10–8:20'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 14, phase: 3, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '30 min continuous @ 7:55–8:00', { warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '5 × 3 min @ 7:20–7:30', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9–10 mi with 3 mi finish @ 8:10–8:20'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 15, phase: 3, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 2 mi @ 7:50–7:55', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '4 × 4 min @ 7:20–7:25', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9–10 mi with 3 mi finish @ 8:10–8:20'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 16, phase: 3, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '35 min continuous @ 7:55', { warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '4 × 4 min @ 7:20–7:25', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '10 mi with 4 mi finish @ 8:05–8:15'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 17, phase: 3, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '3 × 2 mi @ 7:50–7:55', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '5 × 4 min @ 7:15–7:25', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '10 mi with 4 mi finish @ 8:05–8:15'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 18, phase: 3, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 3 mi @ 7:50–7:55', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', checkpoint: true, note: 'CHECKPOINT: Third rep must hold. HR peak 168–172 acceptable.' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '5 × 4 min @ 7:15–7:25', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '10 mi with 4 mi finish @ 8:05–8:15'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},

  // ======== PHASE 4 ========
  { n: 19, phase: 4, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('threshold', '2 × 2 mi @ 7:48–7:52', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '4 × 3 min @ 7:15–7:20', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', note: 'Maintain ceiling.', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9 mi with 3 mi finish @ 8:00–8:10'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 20, phase: 4, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('racepace', '4 × 1 mi @ 7:45–7:50', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '4 × 3 min @ 7:15–7:20', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '9 mi with 3 mi finish @ 8:00–8:10'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 21, phase: 4, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('racepace', '3 × 1.5 mi @ 7:45–7:50', { recovery: '2 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('vo2', '4 × 3 min @ 7:15–7:20', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '7 mi easy'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 22, phase: 4, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('taper', '3 × 8 min @ 7:48–7:52', { recovery: '3 min jog', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', note: 'Taper: quality at reduced volume.' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('taper', '4 × 2 min @ 7:40–7:50', { recovery: 'Full recovery', warmup: '1.5–2 mi easy', cooldown: '1 mi easy', strength: 'maintenance' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '6 mi easy'),
    sun: D('easy', 'Easy 3 mi or rest', { strength: 'primary' }),
  }},
  { n: 23, phase: 4, days: {
    mon: D('rest', 'Rest or easy 30 min'),
    tue: D('taper', '3 × 5 min @ 7:45–7:50', { recovery: 'Full recovery', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', 'Easy 3–4 mi'),
    thu: D('taper', '3 × 2 min @ 7:45', { recovery: 'Full recovery', warmup: '1.5–2 mi easy', cooldown: '1 mi easy' }),
    fri: D('rest', 'Rest or tennis'),
    sat: D('long', '4 mi easy'),
    sun: D('easy', 'Easy 3 mi or rest', { note: 'Light strength only this week.' }),
  }},
  { n: 24, phase: 4, days: {
    mon: D('easy', '3 mi easy'),
    tue: D('taper', '2 × 1 mi @ 7:50', { recovery: 'Full recovery', warmup: '1.5 mi easy', cooldown: '1 mi easy' }),
    wed: D('easy', '3 mi easy'),
    thu: D('strides', '3 mi + 4 strides', { note: 'Strides after easy miles, full recovery.' }),
    fri: D('rest', 'Rest'),
    sat: D('race', '5-MILE RACE', { note: 'Target 7:50–7:55/mi (~39:10–39:35). Mile 1 at 8:00–8:05, settle to 7:55 by mile 2, hold through mile 4, compete mile 5. Do NOT go under 7:50 in mile 1.' }),
    sun: D('rest', 'Rest or easy shakeout'),
  }},

  // ======== PHASE 5 (TBD until 5-mile result) ========
  { n: 25, phase: 5, tbd: true, days: { mon: D('rest','TBD'), tue: D('rest','TBD'), wed: D('rest','TBD'), thu: D('rest','TBD'), fri: D('rest','TBD'), sat: D('rest','TBD'), sun: D('rest','TBD') }},
  { n: 26, phase: 5, tbd: true, days: { mon: D('rest','TBD'), tue: D('rest','TBD'), wed: D('rest','TBD'), thu: D('rest','TBD'), fri: D('rest','TBD'), sat: D('rest','TBD'), sun: D('rest','TBD') }},
  { n: 27, phase: 5, tbd: true, days: { mon: D('rest','TBD'), tue: D('rest','TBD'), wed: D('rest','TBD'), thu: D('rest','TBD'), fri: D('rest','TBD'), sat: D('rest','TBD'), sun: D('rest','TBD') }},
  { n: 28, phase: 5, tbd: true, days: { mon: D('rest','TBD'), tue: D('rest','TBD'), wed: D('rest','TBD'), thu: D('rest','TBD'), fri: D('rest','TBD'), sat: D('rest','TBD'), sun: D('rest','TBD') }},
  { n: 29, phase: 5, tbd: true, days: { mon: D('rest','TBD'), tue: D('rest','TBD'), wed: D('rest','TBD'), thu: D('rest','TBD'), fri: D('rest','TBD'), sat: D('rest','TBD'), sun: D('rest','TBD') }},
  { n: 30, phase: 5, tbd: true, days: { mon: D('rest','TBD'), tue: D('rest','TBD'), wed: D('rest','TBD'), thu: D('rest','TBD'), fri: D('rest','TBD'), sat: D('rest','TBD'), sun: D('rest','TBD') }},
];

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_SHORT = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

// =========================================================
// DATE HELPERS
// =========================================================

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function dateForWeekDay(weekNum, dayKey) {
  const offset = (weekNum - 1) * 7 + DAY_KEYS.indexOf(dayKey);
  return addDays(PLAN_START, offset);
}
function getCurrentWeekAndDay() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - PLAN_START) / 86400000);
  if (diffDays < 0) return { weekNum: 1, dayKey: 'mon', isBeforeStart: true };
  const weekNum = Math.floor(diffDays / 7) + 1;
  const dayIdx = diffDays % 7;
  return { weekNum: Math.min(weekNum, TOTAL_WEEKS), dayKey: DAY_KEYS[dayIdx], isBeforeStart: false };
}
function fmtDate(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtRange(start, end) { return `${fmtDate(start)} – ${fmtDate(end)}`; }

// =========================================================
// APP
// =========================================================

export default function App() {
  const [status, setStatus] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const { weekNum: todayWeek, dayKey: todayDay, isBeforeStart } = useMemo(() => getCurrentWeekAndDay(), []);
  const [viewWeek, setViewWeek] = useState(todayWeek);
  const [expandedKey, setExpandedKey] = useState(null);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) < 50) return;
    if (delta > 0) setViewWeek(w => Math.min(TOTAL_WEEKS, w + 1));
    else setViewWeek(w => Math.max(1, w - 1));
    touchStartX.current = null;
  };

  const fireWeekConfetti = () => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#f59e0b', '#10b981', '#fb923c', '#fef3c7'] });
    setTimeout(() => confetti({ particleCount: 40, spread: 80, origin: { y: 0.5 }, colors: ['#f59e0b', '#10b981'] }), 250);
  };

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(status)); } catch { /* ignore */ }
  }, [status]);

  const week = WEEKS[viewWeek - 1];
  const phase = PHASES[week.phase - 1];
  const weekStart = dateForWeekDay(viewWeek, 'mon');
  const weekEnd = dateForWeekDay(viewWeek, 'sun');

  const setKey = (weekN, dayKey, value) => {
    const k = `w${weekN}-${dayKey}`;
    setStatus(s => {
      const next = { ...s };
      if (value === null) delete next[k]; else next[k] = value;
      return next;
    });
  };

  // Stats
  const stats = useMemo(() => {
    let done = 0, missed = 0, totalAll = 0;
    WEEKS.forEach(w => {
      if (w.tbd) return;
      DAY_KEYS.forEach(dk => {
        const d = w.days[dk];
        if (!d || d.type === 'rest') return;
        totalAll++;
        const k = `w${w.n}-${dk}`;
        if (status[k] === 'done') done++;
        if (status[k] === 'missed') missed++;
      });
    });
    return { done, missed, totalAll };
  }, [status]);

  return (
    <div style={{ fontFamily: 'Manrope, system-ui, sans-serif', backgroundColor: '#0f0d0b', color: '#eae6e0', minHeight: '100dvh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ============ HEADER ============ */}
        <header className="mb-8 sm:mb-12">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-stone-500 mb-2">10K Training Block</div>
              <h1 className="font-display text-3xl sm:text-5xl leading-[1.05]">
                <span className="font-mono num-feature text-stone-300">52:56</span>
                <span className="text-stone-600 mx-2">→</span>
                <span className="num-feature text-amber-500" style={{ fontWeight: 600 }}>48:00</span>
              </h1>
              <div className="mt-2 text-sm text-stone-400">
                Target pace <span className="font-mono text-stone-200">7:45/mi</span> · 30-week block
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-1">Progress</div>
              <div className="font-display text-2xl num-feature">
                {stats.done}<span className="text-stone-600 text-lg">/{stats.totalAll}</span>
              </div>
              <div className="text-xs text-stone-500 mt-1">workouts complete</div>
            </div>
          </div>

          {/* Phase strip */}
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {PHASES.map(p => {
              const isActive = p.num === week.phase;
              const weeksTotal = p.weeks.length;
              const progress = p.num < phase.num ? 1
                : p.num > phase.num ? 0
                : ((todayWeek - p.weeks[0]) / weeksTotal);
              return (
                <button
                  key={p.num}
                  onClick={() => setViewWeek(p.weeks[0])}
                  className="group text-left"
                >
                  <div className="relative h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#2a2420' }}>
                    <div className="absolute inset-y-0 left-0 transition-all" style={{
                      width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                      backgroundColor: p.accent,
                    }}/>
                  </div>
                  <div className={`text-[10px] sm:text-xs uppercase tracking-wider transition-colors ${isActive ? 'text-stone-200' : 'text-stone-600 group-hover:text-stone-400'}`}>
                    Phase {p.num}
                  </div>
                </button>
              );
            })}
          </div>
        </header>

        {/* ============ PHASE BANNER ============ */}
        <div className="mb-6 sm:mb-8 p-5 sm:p-6 rounded-2xl border chip-shadow" style={{ borderColor: '#2a2420', backgroundColor: '#16130f' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.accent }}/>
            <div className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Phase {phase.num} of 5
            </div>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl mb-2" style={{ fontWeight: 500 }}>{phase.name}</h2>
          <p className="text-sm text-stone-400 leading-relaxed max-w-2xl">{phase.goal}</p>
          <div className="mt-4 pt-4 border-t flex items-start gap-2 text-xs text-stone-500" style={{ borderColor: '#2a2420' }}>
            <Flag className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: phase.accent }}/>
            <div><span className="text-stone-400">Checkpoint:</span> {phase.checkpoint}</div>
          </div>
        </div>

        {/* ============ WEEK NAV ============ */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setViewWeek(w => Math.max(1, w - 1))}
            disabled={viewWeek === 1}
            className="p-2 rounded-lg hover:bg-stone-800/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5"/>
          </button>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-1">Week</div>
            <div className="font-display text-2xl num-feature" style={{ fontWeight: 500 }}>
              {viewWeek} <span className="text-stone-600 text-base">of {TOTAL_WEEKS}</span>
            </div>
            <div className="text-xs font-mono text-stone-400 mt-1">{fmtRange(weekStart, weekEnd)}</div>
            {viewWeek !== todayWeek && !isBeforeStart && (
              <button
                onClick={() => setViewWeek(todayWeek)}
                className="mt-2 text-[10px] uppercase tracking-wider text-amber-500 hover:text-amber-400"
              >
                ↩ Jump to today
              </button>
            )}
          </div>
          <button
            onClick={() => setViewWeek(w => Math.min(TOTAL_WEEKS, w + 1))}
            disabled={viewWeek === TOTAL_WEEKS}
            className="p-2 rounded-lg hover:bg-stone-800/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5"/>
          </button>
        </div>

        {/* ============ DAY CARDS ============ */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {week.tbd ? (
          <div className="p-8 text-center rounded-2xl border border-dashed" style={{ borderColor: '#3a3026' }}>
            <Hourglass className="w-6 h-6 mx-auto mb-3 text-stone-500"/>
            <div className="font-display text-lg text-stone-300" style={{ fontWeight: 500 }}>Phase 5 — To be built</div>
            <div className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
              Structure decided after the 5-mile race result on Sep 19. Four weeks of 10K-specific work at 7:45–7:50 pace, then a 2-week taper, then race day.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {DAY_KEYS.map(dk => {
              const workout = week.days[dk];
              const date = dateForWeekDay(viewWeek, dk);
              const isToday = !isBeforeStart && viewWeek === todayWeek && dk === todayDay;
              const key = `w${viewWeek}-${dk}`;
              const st = status[key];
              const expanded = expandedKey === key;
              const isHero = isToday;
              return (
                <DayCard
                  key={dk}
                  dayKey={dk}
                  date={date}
                  workout={workout}
                  isToday={isToday}
                  status={st}
                  expanded={expanded || isHero}
                  canCollapse={!isHero}
                  onToggleExpand={() => setExpandedKey(expanded ? null : key)}
                  onMarkDone={() => { if (dk === 'sat' && st !== 'done') fireWeekConfetti(); setKey(viewWeek, dk, st === 'done' ? null : 'done'); }}
                  onMarkMissed={() => setKey(viewWeek, dk, st === 'missed' ? null : 'missed')}
                  phaseColor={phase.accent}
                />
              );
            })}
          </div>
        )}
        </div>

        {/* ============ FOOTER STATS ============ */}
        <div className="mt-10 pt-8 border-t grid grid-cols-3 gap-3 sm:gap-6" style={{ borderColor: '#2a2420' }}>
          <StatBox label="Done" value={stats.done} accent="#10b981"/>
          <StatBox label="Missed" value={stats.missed} accent="#dc2626"/>
          <StatBox label="Remaining" value={Math.max(0, stats.totalAll - stats.done - stats.missed)} accent="#78716c"/>
        </div>

        <div className="mt-10 mb-safe text-center text-xs text-stone-600">
          <div className="font-display italic">
            "Every workout must answer: how does this help me sustain 7:45 for 6.2 miles?"
          </div>
        </div>

      </div>
    </div>
  );
}

// =========================================================
// DAY CARD
// =========================================================

function DayCard({ dayKey, date, workout, isToday, status, expanded, canCollapse, onToggleExpand, onMarkDone, onMarkMissed, phaseColor }) {
  const meta = TYPE_META[workout.type] || TYPE_META.easy;
  const Icon = meta.icon;
  const isRest = workout.type === 'rest';
  const isCheckpoint = workout.checkpoint;

  const borderColor = isToday ? phaseColor
    : status === 'done' ? '#134e2e'
    : status === 'missed' ? '#4c1d1d'
    : '#2a2420';
  const bgColor = isToday ? '#1a1612'
    : status === 'done' ? '#0f1a14'
    : status === 'missed' ? '#1a0f0f'
    : '#13110e';

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${isToday ? 'chip-shadow' : ''}`}
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <button
        onClick={canCollapse ? onToggleExpand : undefined}
        disabled={!canCollapse}
        className={`w-full text-left p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${canCollapse ? 'hover:bg-black/20 cursor-pointer' : ''}`}
      >
        <div className="flex-shrink-0 text-center w-12 sm:w-14">
          <div className={`text-[10px] uppercase tracking-wider ${isToday ? 'text-amber-500' : 'text-stone-500'}`}>
            {DAY_SHORT[dayKey]}
          </div>
          <div className="font-display text-xl sm:text-2xl num-feature leading-none mt-0.5" style={{ fontWeight: 500 }}>
            {date.getDate()}
          </div>
        </div>

        <div className="w-px h-10 flex-shrink-0" style={{ backgroundColor: '#2a2420' }}/>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isRest ? '#57534e' : meta.color }}/>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: isRest ? '#78716c' : meta.color }}>
              {meta.label}
            </div>
            {isCheckpoint && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: phaseColor, color: '#0f0d0b' }}>
                Checkpoint
              </span>
            )}
            {isToday && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f59e0b', color: '#0f0d0b' }}>
                Today
              </span>
            )}
          </div>
          <div className={`font-display text-base sm:text-lg leading-snug ${status === 'done' ? 'text-stone-500 line-through' : status === 'missed' ? 'text-stone-500' : 'text-stone-100'}`} style={{ fontWeight: 500 }}>
            {workout.title}
          </div>
        </div>

        <div className="flex-shrink-0">
          {status === 'done' && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
              <Check className="w-4 h-4" strokeWidth={3} style={{ color: '#0f0d0b' }}/>
            </div>
          )}
          {status === 'missed' && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>
              <X className="w-4 h-4" strokeWidth={3} style={{ color: '#0f0d0b' }}/>
            </div>
          )}
          {!status && canCollapse && (
            expanded ? <ChevronUp className="w-4 h-4 text-stone-500"/> : <ChevronDown className="w-4 h-4 text-stone-500"/>
          )}
        </div>
      </button>

      {expanded && (
        <div className="fade-in px-4 sm:px-5 pb-5 pt-1">
          <div className="pl-0 sm:pl-[72px]">
            {!isRest && (
              <div className="space-y-3 text-sm">
                {workout.warmup && <DetailRow label="Warmup" value={workout.warmup}/>}
                <DetailRow label="Main set" value={workout.title} mono primary/>
                {workout.recovery && <DetailRow label="Recovery" value={workout.recovery} mono/>}
                {workout.cooldown && <DetailRow label="Cooldown" value={workout.cooldown}/>}
                {workout.strength && (
                  <DetailRow label="Strength" value={workout.strength === 'primary' ? 'Primary session (full volume)' : 'Post-run maintenance'} icon={Dumbbell}/>
                )}
                {workout.note && (
                  <div className="mt-3 pt-3 border-t flex items-start gap-2 text-xs text-stone-400" style={{ borderColor: '#2a2420' }}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600"/>
                    <div>{workout.note}</div>
                  </div>
                )}
              </div>
            )}
            {isRest && workout.note && (
              <div className="text-sm text-stone-500 italic">{workout.note}</div>
            )}

            {!isRest && (
              <div className="mt-4 pt-4 border-t flex gap-2" style={{ borderColor: '#2a2420' }}>
                <button
                  onClick={onMarkDone}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: status === 'done' ? '#10b981' : 'transparent',
                    color: status === 'done' ? '#0f0d0b' : '#10b981',
                    border: `1px solid ${status === 'done' ? '#10b981' : '#134e2e'}`,
                  }}
                >
                  <Check className="w-4 h-4" strokeWidth={2.5}/>
                  {status === 'done' ? 'Completed' : 'Mark done'}
                </button>
                <button
                  onClick={onMarkMissed}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: status === 'missed' ? '#dc2626' : 'transparent',
                    color: status === 'missed' ? '#0f0d0b' : '#dc2626',
                    border: `1px solid ${status === 'missed' ? '#dc2626' : '#4c1d1d'}`,
                  }}
                >
                  <X className="w-4 h-4" strokeWidth={2.5}/>
                  Missed
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, primary, icon: IconComp }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="text-[10px] uppercase tracking-wider text-stone-500 w-20 flex-shrink-0 flex items-center gap-1.5">
        {IconComp && <IconComp className="w-3 h-3"/>}
        {label}
      </div>
      <div className={`${mono ? 'font-mono' : ''} ${primary ? 'text-stone-100' : 'text-stone-300'} text-sm num-feature`}>
        {value}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">{label}</div>
      <div className="font-display text-3xl sm:text-4xl num-feature" style={{ color: accent, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
