import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area
} from 'recharts';

// ==================== EMBEDDED DATA ====================

const CURRENCY_RATES = {
    EUR: 1, USD: 1.09, INR: 90.5, CNY: 7.85,
    NGN: 1650, PKR: 302, BDT: 119, GBP: 0.86
};

const GERMAN_STATES = [
    { id: 'bw', name: 'Baden-Württemberg', capital: 'Stuttgart', cities: ['Stuttgart', 'Heidelberg', 'Freiburg', 'Karlsruhe', 'Mannheim', 'Tübingen'], avgRent: 520, costIndex: 115, universities: 70, color: '#1a365d' },
    { id: 'by', name: 'Bavaria', capital: 'Munich', cities: ['Munich', 'Nuremberg', 'Augsburg', 'Würzburg', 'Regensburg', 'Erlangen'], avgRent: 580, costIndex: 125, universities: 58, color: '#0d9488' },
    { id: 'be', name: 'Berlin', capital: 'Berlin', cities: ['Berlin'], avgRent: 480, costIndex: 108, universities: 39, color: '#dc2626' },
    { id: 'bb', name: 'Brandenburg', capital: 'Potsdam', cities: ['Potsdam', 'Cottbus', 'Frankfurt (Oder)'], avgRent: 340, costIndex: 88, universities: 10, color: '#7c3aed' },
    { id: 'hb', name: 'Bremen', capital: 'Bremen', cities: ['Bremen', 'Bremerhaven'], avgRent: 380, costIndex: 95, universities: 8, color: '#059669' },
    { id: 'hh', name: 'Hamburg', capital: 'Hamburg', cities: ['Hamburg'], avgRent: 520, costIndex: 118, universities: 20, color: '#b91c1c' },
    { id: 'he', name: 'Hesse', capital: 'Wiesbaden', cities: ['Frankfurt', 'Darmstadt', 'Marburg', 'Gießen', 'Kassel'], avgRent: 480, costIndex: 112, universities: 31, color: '#c2410c' },
    { id: 'ni', name: 'Lower Saxony', capital: 'Hanover', cities: ['Hanover', 'Göttingen', 'Braunschweig', 'Oldenburg', 'Osnabrück'], avgRent: 400, costIndex: 96, universities: 29, color: '#4f46e5' },
    { id: 'mv', name: 'Mecklenburg-Vorpommern', capital: 'Schwerin', cities: ['Rostock', 'Greifswald', 'Schwerin'], avgRent: 320, costIndex: 82, universities: 7, color: '#0891b2' },
    { id: 'nw', name: 'North Rhine-Westphalia', capital: 'Düsseldorf', cities: ['Cologne', 'Düsseldorf', 'Bonn', 'Aachen', 'Münster', 'Dortmund'], avgRent: 450, costIndex: 105, universities: 68, color: '#65a30d' },
    { id: 'rp', name: 'Rhineland-Palatinate', capital: 'Mainz', cities: ['Mainz', 'Trier', 'Kaiserslautern', 'Koblenz'], avgRent: 380, costIndex: 94, universities: 18, color: '#ca8a04' },
    { id: 'sl', name: 'Saarland', capital: 'Saarbrücken', cities: ['Saarbrücken'], avgRent: 350, costIndex: 90, universities: 5, color: '#db2777' },
    { id: 'sn', name: 'Saxony', capital: 'Dresden', cities: ['Leipzig', 'Dresden', 'Chemnitz'], avgRent: 340, costIndex: 85, universities: 24, color: '#16a34a' },
    { id: 'st', name: 'Saxony-Anhalt', capital: 'Magdeburg', cities: ['Halle', 'Magdeburg'], avgRent: 300, costIndex: 80, universities: 10, color: '#2563eb' },
    { id: 'sh', name: 'Schleswig-Holstein', capital: 'Kiel', cities: ['Kiel', 'Lübeck', 'Flensburg'], avgRent: 400, costIndex: 98, universities: 11, color: '#7c2d12' },
    { id: 'th', name: 'Thuringia', capital: 'Erfurt', cities: ['Jena', 'Erfurt', 'Weimar', 'Ilmenau'], avgRent: 310, costIndex: 82, universities: 12, color: '#6d28d9' }
];

const CITIES_DATA = [
    { name: 'Munich', state: 'Bavaria', rent: 650, groceries: 220, transport: 0, dining: 80, leisure: 70, total: 1150, costIndex: 130, popularity: 95, studentPop: 128000 },
    { name: 'Frankfurt', state: 'Hesse', rent: 550, groceries: 200, transport: 0, dining: 70, leisure: 65, total: 1020, costIndex: 118, popularity: 85, studentPop: 72000 },
    { name: 'Stuttgart', state: 'Baden-Württemberg', rent: 520, groceries: 195, transport: 0, dining: 65, leisure: 60, total: 970, costIndex: 115, popularity: 80, studentPop: 58000 },
    { name: 'Hamburg', state: 'Hamburg', rent: 530, groceries: 190, transport: 0, dining: 70, leisure: 65, total: 985, costIndex: 116, popularity: 90, studentPop: 105000 },
    { name: 'Düsseldorf', state: 'NRW', rent: 500, groceries: 185, transport: 0, dining: 65, leisure: 60, total: 940, costIndex: 112, popularity: 75, studentPop: 45000 },
    { name: 'Berlin', state: 'Berlin', rent: 480, groceries: 180, transport: 0, dining: 60, leisure: 55, total: 905, costIndex: 108, popularity: 98, studentPop: 195000 },
    { name: 'Cologne', state: 'NRW', rent: 470, groceries: 175, transport: 0, dining: 60, leisure: 55, total: 890, costIndex: 106, popularity: 88, studentPop: 100000 },
    { name: 'Heidelberg', state: 'Baden-Württemberg', rent: 480, groceries: 180, transport: 0, dining: 55, leisure: 50, total: 895, costIndex: 107, popularity: 82, studentPop: 38000 },
    { name: 'Freiburg', state: 'Baden-Württemberg', rent: 460, groceries: 175, transport: 0, dining: 55, leisure: 50, total: 870, costIndex: 104, popularity: 78, studentPop: 33000 },
    { name: 'Bonn', state: 'NRW', rent: 440, groceries: 170, transport: 0, dining: 55, leisure: 50, total: 845, costIndex: 102, popularity: 72, studentPop: 38000 },
    { name: 'Aachen', state: 'NRW', rent: 420, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 810, costIndex: 98, popularity: 76, studentPop: 60000 },
    { name: 'Münster', state: 'NRW', rent: 430, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 820, costIndex: 99, popularity: 80, studentPop: 62000 },
    { name: 'Hanover', state: 'Lower Saxony', rent: 410, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 800, costIndex: 97, popularity: 70, studentPop: 48000 },
    { name: 'Nuremberg', state: 'Bavaria', rent: 420, groceries: 170, transport: 0, dining: 55, leisure: 50, total: 825, costIndex: 100, popularity: 68, studentPop: 35000 },
    { name: 'Göttingen', state: 'Lower Saxony', rent: 380, groceries: 160, transport: 0, dining: 45, leisure: 40, total: 755, costIndex: 92, popularity: 74, studentPop: 31000 },
    { name: 'Marburg', state: 'Hesse', rent: 370, groceries: 155, transport: 0, dining: 45, leisure: 40, total: 740, costIndex: 90, popularity: 70, studentPop: 26000 },
    { name: 'Tübingen', state: 'Baden-Württemberg', rent: 420, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 810, costIndex: 98, popularity: 72, studentPop: 28000 },
    { name: 'Leipzig', state: 'Saxony', rent: 350, groceries: 150, transport: 0, dining: 40, leisure: 35, total: 705, costIndex: 85, popularity: 92, studentPop: 40000 },
    { name: 'Dresden', state: 'Saxony', rent: 360, groceries: 155, transport: 0, dining: 45, leisure: 40, total: 730, costIndex: 88, popularity: 86, studentPop: 43000 },
    { name: 'Jena', state: 'Thuringia', rent: 330, groceries: 145, transport: 0, dining: 40, leisure: 35, total: 680, costIndex: 82, popularity: 75, studentPop: 23000 },
    { name: 'Halle', state: 'Saxony-Anhalt', rent: 300, groceries: 140, transport: 0, dining: 35, leisure: 30, total: 635, costIndex: 78, popularity: 65, studentPop: 21000 },
    { name: 'Magdeburg', state: 'Saxony-Anhalt', rent: 310, groceries: 145, transport: 0, dining: 38, leisure: 32, total: 655, costIndex: 80, popularity: 62, studentPop: 18000 },
    { name: 'Greifswald', state: 'Mecklenburg-Vorpommern', rent: 290, groceries: 140, transport: 0, dining: 35, leisure: 30, total: 625, costIndex: 76, popularity: 58, studentPop: 11000 },
    { name: 'Chemnitz', state: 'Saxony', rent: 280, groceries: 138, transport: 0, dining: 32, leisure: 28, total: 608, costIndex: 74, popularity: 52, studentPop: 10000 },
    { name: 'Rostock', state: 'Mecklenburg-Vorpommern', rent: 340, groceries: 150, transport: 0, dining: 42, leisure: 38, total: 700, costIndex: 85, popularity: 68, studentPop: 15000 }
];

const BUDGET_TIERS = [
    { name: 'Essential', range: '€700–850', monthly: 775, description: 'Minimum viable — dormitory, home cooking, limited social spending', color: '#94a3b8', accent: '#475569' },
    { name: 'Balanced', range: '€850–1,100', monthly: 975, description: 'Comfortable daily life with occasional dining out and leisure', color: '#3b82f6', accent: '#1d4ed8' },
    { name: 'Comfortable', range: '€1,100–1,400', monthly: 1250, description: 'Relaxed lifestyle with regular social activities and travel', color: '#10b981', accent: '#047857' }
];

const MONTHLY_BREAKDOWN = [
    { category: 'Rent', survival: 300, comfortable: 420, relaxed: 550 },
    { category: 'Health Insurance', survival: 110, comfortable: 115, relaxed: 120 },
    { category: 'Groceries', survival: 140, comfortable: 200, relaxed: 280 },
    { category: 'Transport', survival: 0, comfortable: 25, relaxed: 49 },
    { category: 'Phone / Internet', survival: 20, comfortable: 30, relaxed: 45 },
    { category: 'Study Materials', survival: 20, comfortable: 35, relaxed: 50 },
    { category: 'Personal Care', survival: 20, comfortable: 30, relaxed: 45 },
    { category: 'Leisure', survival: 25, comfortable: 60, relaxed: 100 },
    { category: 'Dining Out', survival: 20, comfortable: 45, relaxed: 80 },
    { category: 'Miscellaneous', survival: 20, comfortable: 40, relaxed: 80 }
];

const RENT_TRENDS = [
    { year: '2019', munich: 520, berlin: 380, leipzig: 280, avg: 380 },
    { year: '2020', munich: 550, berlin: 400, leipzig: 290, avg: 400 },
    { year: '2021', munich: 580, berlin: 430, leipzig: 310, avg: 420 },
    { year: '2022', munich: 620, berlin: 460, leipzig: 330, avg: 450 },
    { year: '2023', munich: 640, berlin: 475, leipzig: 345, avg: 465 },
    { year: '2024', munich: 650, berlin: 480, leipzig: 350, avg: 475 }
];

const MONEY_SAVING_TIPS = [
    { tip: 'Apply for student housing 6+ months early', impact: 'Save €100–200/month' },
    { tip: 'Use Mensa (university cafeteria) daily', impact: 'Meals from €2.50–4.50' },
    { tip: 'Get the Deutschland-Ticket for €49/month', impact: 'Unlimited nationwide rail & transit' },
    { tip: 'Shop at Aldi, Lidl, or Penny', impact: '30–40% savings on groceries' },
    { tip: 'Source furniture on eBay Kleinanzeigen', impact: '60–80% less than retail' },
    { tip: 'Borrow from the university library', impact: 'Save €100–300 per semester' },
    { tip: 'Join Hochschulsport for university fitness', impact: '€10–30/semester vs. €30+/month gyms' },
    { tip: 'Batch cook and meal prep weekly', impact: 'Save €50–100/month on food' },
    { tip: 'Get an ISIC card for student discounts', impact: 'Discounts across travel, retail & culture' },
    { tip: 'Consider Eastern German cities', impact: '20–40% lower overall cost of living' }
];

// ==================== STYLES ====================

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --ink: #0a0f1e;
    --ink-60: #6b7280;
    --ink-30: #d1d5db;
    --ink-10: #f3f4f6;
    --paper: #fafaf8;
    --blue: #1d4ed8;
    --blue-light: #eff6ff;
    --green: #059669;
    --green-light: #ecfdf5;
    --amber: #d97706;
    --amber-light: #fffbeb;
    --red: #dc2626;
    --border: #e5e7eb;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow: 0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
    --shadow-lg: 0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
  }

  .gcl-wrap * { box-sizing: border-box; }
  .gcl-wrap { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; color: var(--ink); background: var(--paper); }
  .serif { font-family: 'DM Serif Display', Georgia, serif; }

  /* Layout */
  .gcl-hero { background: var(--ink); color: #fff; padding: 64px 0 56px; position: relative; overflow: hidden; }
  .gcl-hero::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px); }
  .gcl-hero::after { content: 'DE'; position: absolute; right: -20px; top: 50%; transform: translateY(-50%); font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(180px, 25vw, 320px); color: rgba(255,255,255,0.04); line-height: 1; pointer-events: none; }

  .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
  .section { padding: 48px 0; }
  .section + .section { border-top: 1px solid var(--border); }

  /* Hero elements */
  .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 100px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.7); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 20px; }
  .hero-title { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(42px, 7vw, 72px); line-height: 1.05; color: #fff; margin: 0 0 16px; }
  .hero-title em { font-style: italic; color: rgba(255,255,255,0.55); }
  .hero-sub { font-size: 17px; color: rgba(255,255,255,0.55); max-width: 480px; line-height: 1.6; margin: 0 0 40px; font-weight: 300; }

  /* KPI strip */
  .kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; margin-top: 48px; }
  .kpi-item { padding: 20px 24px; background: rgba(255,255,255,0.04); }
  .kpi-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
  .kpi-value { font-size: clamp(22px, 3vw, 28px); font-weight: 700; color: #fff; line-height: 1; }
  .kpi-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; }

  /* Currency selector */
  .currency-row { display: flex; align-items: center; gap: 12px; margin-bottom: 0; }
  .currency-label { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.4); letter-spacing: 0.05em; text-transform: uppercase; }
  .currency-select { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #fff; font-family: inherit; font-size: 13px; font-weight: 500; padding: 8px 32px 8px 12px; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; background-size: 16px; cursor: pointer; }
  .currency-select option { background: #1a1a2e; }

  /* Tabs */
  .tab-nav { position: sticky; top: 0; z-index: 40; background: rgba(250,250,248,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
  .tab-list { display: flex; gap: 0; overflow-x: auto; scrollbar-width: none; padding: 0; }
  .tab-list::-webkit-scrollbar { display: none; }
  .tab-btn { display: flex; align-items: center; gap: 8px; padding: 16px 20px; font-size: 13px; font-weight: 500; color: var(--ink-60); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.15s; font-family: inherit; }
  .tab-btn:hover { color: var(--ink); }
  .tab-btn.active { color: var(--blue); border-bottom-color: var(--blue); font-weight: 600; }
  .tab-icon { width: 16px; height: 16px; opacity: 0.6; }
  .tab-btn.active .tab-icon { opacity: 1; }

  /* Cards */
  .card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 28px; box-shadow: var(--shadow-sm); }
  .card-lg { padding: 36px; }
  .card-title { font-size: 16px; font-weight: 600; color: var(--ink); margin: 0 0 4px; }
  .card-sub { font-size: 13px; color: var(--ink-60); margin: 0 0 24px; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media(min-width: 900px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 20px; box-shadow: var(--shadow-sm); }
  .stat-card-label { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-60); margin-bottom: 10px; }
  .stat-card-value { font-size: 24px; font-weight: 700; color: var(--ink); line-height: 1; }
  .stat-card-sub { font-size: 12px; color: var(--ink-60); margin-top: 4px; }

  /* Grid layouts */
  .grid-2 { display: grid; grid-template-columns: 1fr; gap: 20px; }
  @media(min-width: 768px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
  .grid-3 { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media(min-width: 640px) { .grid-3 { grid-template-columns: 1fr 1fr; } }
  @media(min-width: 1024px) { .grid-3 { grid-template-columns: 1fr 1fr 1fr; } }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .data-table thead th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-60); background: var(--ink-10); border-bottom: 1px solid var(--border); cursor: pointer; user-select: none; white-space: nowrap; }
  .data-table thead th:hover { color: var(--ink); }
  .data-table thead th.right { text-align: right; }
  .data-table thead th.highlight { background: var(--blue-light); color: var(--blue); }
  .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; cursor: pointer; }
  .data-table tbody tr:hover { background: #f9fafb; }
  .data-table tbody tr.expanded { background: #f0f7ff; }
  .data-table td { padding: 13px 16px; color: var(--ink); }
  .data-table td.right { text-align: right; }
  .data-table td.muted { color: var(--ink-60); }
  .data-table td.highlight { background: var(--blue-light); font-weight: 600; color: var(--blue); }
  .data-table td.hide-sm { display: none; }
  @media(min-width: 768px) { .data-table td.hide-sm { display: table-cell; } }
  .data-table th.hide-sm { display: none; }
  @media(min-width: 768px) { .data-table th.hide-sm { display: table-cell; } }

  /* State dot */
  .state-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; }

  /* Budget tiers */
  .tier-row { display: flex; flex-direction: column; gap: 12px; }
  .tier-item { border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; transition: border-color 0.15s, box-shadow 0.15s; }
  .tier-item:hover { border-color: #93c5fd; box-shadow: var(--shadow-sm); }
  .tier-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .tier-name { font-weight: 700; font-size: 15px; }
  .tier-range { font-size: 16px; font-weight: 700; color: var(--ink); }
  .tier-desc { font-size: 13px; color: var(--ink-60); margin-bottom: 12px; }
  .tier-bar-track { height: 4px; background: var(--ink-10); border-radius: 4px; overflow: hidden; }
  .tier-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

  /* Pie label */
  .pie-label { font-size: 12px; fill: var(--ink); }

  /* City chips */
  .chip { display: inline-block; padding: 5px 12px; background: var(--ink-10); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--ink-60); cursor: pointer; transition: all 0.15s; }
  .chip.selected { background: var(--blue); border-color: var(--blue); color: #fff; }
  .chip:hover:not(.selected) { border-color: #93c5fd; color: var(--blue); background: var(--blue-light); }

  /* City ranking bar */
  .city-rank-bar { position: relative; height: 6px; background: var(--ink-10); border-radius: 3px; margin-top: 8px; }
  .city-rank-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: linear-gradient(90deg, #3b82f6, #1d4ed8); }

  /* Tag badges */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-green { background: var(--green-light); color: var(--green); }
  .badge-amber { background: var(--amber-light); color: var(--amber); }
  .badge-red { background: #fef2f2; color: var(--red); }
  .badge-blue { background: var(--blue-light); color: var(--blue); }

  /* Tips list */
  .tip-row { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--border); align-items: flex-start; }
  .tip-row:last-child { border-bottom: none; }
  .tip-num { width: 24px; height: 24px; flex-shrink: 0; background: var(--ink); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; margin-top: 1px; }
  .tip-text { flex: 1; }
  .tip-main { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
  .tip-impact { font-size: 12px; color: var(--green); font-weight: 500; }

  /* Working section */
  .work-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .work-stat { padding: 16px; background: var(--ink-10); border-radius: 8px; border: 1px solid var(--border); }
  .work-stat-val { font-size: 22px; font-weight: 700; color: var(--ink); }
  .work-stat-lbl { font-size: 11px; color: var(--ink-60); font-weight: 500; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Calc */
  .option-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .option-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .option-btn { padding: 14px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: #fff; text-align: left; cursor: pointer; transition: all 0.15s; font-family: inherit; }
  .option-btn:hover { border-color: #93c5fd; }
  .option-btn.active { border-color: var(--blue); background: var(--blue-light); }
  .option-label { font-size: 13px; font-weight: 600; color: var(--ink); display: block; }
  .option-desc { font-size: 11px; color: var(--ink-60); margin-top: 3px; display: block; }

  .calc-select { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 14px; font-weight: 500; color: var(--ink); background: #fff; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; cursor: pointer; }
  .calc-select:focus { outline: none; border-color: var(--blue); }

  .result-panel { background: var(--ink); color: #fff; border-radius: 12px; padding: 32px; position: sticky; top: 80px; }
  .result-label { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
  .result-total { font-family: 'DM Serif Display', Georgia, serif; font-size: 52px; line-height: 1; color: #fff; margin-bottom: 8px; }
  .result-city { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 28px; }
  .result-line { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .result-line:last-of-type { border-bottom: none; }
  .result-line-label { font-size: 13px; color: rgba(255,255,255,0.55); }
  .result-line-val { font-size: 14px; font-weight: 600; color: #fff; }
  .result-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 10px; }
  .result-note { margin-top: 20px; padding: 14px 16px; background: rgba(255,255,255,0.06); border-radius: 8px; font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.6; }

  /* Glossary */
  .glossary-row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .glossary-row:last-child { border-bottom: none; }
  .glossary-de { font-weight: 600; font-size: 14px; }
  .glossary-en { font-size: 13px; color: var(--ink-60); text-align: right; }

  /* Expansion row */
  .expand-row td { padding: 0 !important; }
  .expand-inner { padding: 28px; background: #f8faff; border-bottom: 1px solid #dbeafe; }
  .expand-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
  @media(min-width: 768px) { .expand-grid { grid-template-columns: 1fr 1fr; } }
  .expand-label { font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-60); margin-bottom: 14px; }
  .breakdown-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #fff; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; margin-bottom: 8px; }
  .breakdown-row.total { background: var(--blue-light); border-color: #bfdbfe; }
  .breakdown-row.total span { font-weight: 700; color: var(--blue); }

  /* Region comparison */
  .region-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .region-card { padding: 16px; border-radius: 8px; border: 1px solid var(--border); }

  /* Chart tooltip */
  .recharts-tooltip-wrapper { filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1)); }

  /* Section headings */
  .section-heading { margin: 0 0 4px; }
  .section-heading h2 { font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; color: var(--ink); margin: 0; }
  .section-heading p { font-size: 14px; color: var(--ink-60); margin: 6px 0 0; }

  /* Divider line */
  .rule { border: none; border-top: 1px solid var(--border); margin: 40px 0; }

  /* Resources */
  .resource-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px; transition: border-color 0.15s; }
  .resource-row:hover { border-color: #93c5fd; }
  .resource-icon { width: 32px; height: 32px; border-radius: 6px; background: var(--ink-10); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 15px; }
  .resource-title { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .resource-sites { display: flex; flex-wrap: wrap; gap: 6px; }
  .resource-site { font-size: 11px; font-weight: 500; color: var(--ink-60); background: var(--ink-10); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border); }

  /* State cards grid */
  .state-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 20px; transition: box-shadow 0.15s, border-color 0.15s; }
  .state-card:hover { box-shadow: var(--shadow); border-color: #93c5fd; }
  .state-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  .state-abbreviation { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 13px; }
  .state-total { text-align: right; }
  .state-total-label { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-60); }
  .state-total-val { font-size: 20px; font-weight: 700; color: var(--ink); }
  .state-cities { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .state-city-tag { font-size: 11px; color: var(--ink-60); background: var(--ink-10); padding: 3px 8px; border-radius: 4px; }

  /* Cat card */
  .cat-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 24px; }
  .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .cat-name { font-size: 15px; font-weight: 700; color: var(--ink); }
  .cat-avg { font-size: 18px; font-weight: 700; color: var(--ink); }
  .cat-avg-label { font-size: 11px; color: var(--ink-60); text-align: right; }
  .cat-item { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .cat-item:last-child { border-bottom: none; }
  .cat-item-name { font-size: 13px; color: var(--ink); }
  .cat-item-val { font-size: 12px; color: var(--ink-60); background: var(--ink-10); padding: 2px 8px; border-radius: 4px; }

  /* Animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.25s ease-out; }

  @media(max-width: 640px) {
    .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .option-grid-3 { grid-template-columns: repeat(2, 1fr); }
    .result-total { font-size: 38px; }
  }
`;

// ==================== MAIN COMPONENT ====================

const GermanyCostOfLiving = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCurrency, setSelectedCurrency] = useState('EUR');
    const [selectedCities, setSelectedCities] = useState(['Berlin', 'Munich']);
    const [calcCity, setCalcCity] = useState('Berlin');
    const [calcAccommodation, setCalcAccommodation] = useState('wg');
    const [calcLifestyle, setCalcLifestyle] = useState('comfortable');
    const [calcCooking, setCalcCooking] = useState('mostly');

    const convertCurrency = (amount) => {
        const rate = CURRENCY_RATES[selectedCurrency] || 1;
        const converted = amount * rate;
        const symbols = { EUR: '€', USD: '$', GBP: '£' };
        const sym = symbols[selectedCurrency];
        if (sym) return `${sym}${Math.round(converted).toLocaleString()}`;
        return `${Math.round(converted).toLocaleString()} ${selectedCurrency}`;
    };

    const fmt = convertCurrency;

    const calculatedBudget = useMemo(() => {
        const cityData = CITIES_DATA.find(c => c.name === calcCity) || CITIES_DATA[0];
        const m = cityData.costIndex / 100;
        let rent = { dorm: 280, wg: 400, studio: 550 }[calcAccommodation] || 400;
        rent = Math.round(rent * m);
        let food = { always: 140, mostly: 180, sometimes: 250, rarely: 350 }[calcCooking] || 180;
        const lm = { budget: 0.8, comfortable: 1, relaxed: 1.3 }[calcLifestyle] || 1;
        return {
            rent,
            food,
            insurance: 115,
            transport: 25,
            phone: 25,
            leisure: Math.round(50 * lm),
            personal: Math.round(30 * lm),
            misc: Math.round(40 * lm),
            total: Math.round(rent + food + 115 + 25 + 25 + 50 * lm + 30 * lm + 40 * lm)
        };
    }, [calcCity, calcAccommodation, calcLifestyle, calcCooking]);

    const PALETTE = ['#1d4ed8', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

    const getEnrichedState = (s) => {
        const f = s.costIndex / 100;
        const groceries = Math.round(200 * f);
        const total = s.avgRent + groceries + 125 + 49 + Math.round(75 * f) + Math.round(60 * f);
        return { ...s, breakdown: { rent: s.avgRent, groceries, health: 125, transport: 49, leisure: Math.round(75 * f), misc: Math.round(60 * f), total } };
    };

    // =========== TABS ===========

    const OverviewTab = () => {
        const pieData = [
            { name: 'Rent', value: 45, color: '#1d4ed8' },
            { name: 'Food', value: 20, color: '#059669' },
            { name: 'Insurance', value: 12, color: '#dc2626' },
            { name: 'Transport', value: 5, color: '#d97706' },
            { name: 'Leisure', value: 8, color: '#7c3aed' },
            { name: 'Other', value: 10, color: '#9ca3af' }
        ];

        const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
            const RADIAN = Math.PI / 180;
            const r = outerRadius + 22;
            const x = cx + r * Math.cos(-midAngle * RADIAN);
            const y = cy + r * Math.sin(-midAngle * RADIAN);
            if (value < 8) return null;
            return <text x={x} y={y} fill="#374151" fontSize={12} fontWeight={500} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{name} {value}%</text>;
        };

        return (
            <div className="fade-in">
                {/* Stats */}
                <div style={{ marginBottom: 32 }}>
                    <div className="stat-grid">
                        {[
                            { label: 'Avg. Monthly Budget', value: fmt(950), sub: 'Student average, all-in' },
                            { label: 'Avg. WG Room Rent', value: fmt(420), sub: 'Warm rent included' },
                            { label: 'Most Affordable City', value: 'Chemnitz', sub: `${fmt(608)} / month` },
                            { label: 'Most Expensive City', value: 'Munich', sub: `${fmt(1150)} / month` }
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-card-label">{s.label}</div>
                                <div className="stat-card-value">{s.value}</div>
                                <div className="stat-card-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Charts row */}
                <div className="grid-2" style={{ marginBottom: 32 }}>
                    <div className="card">
                        <div className="card-title">Budget Distribution</div>
                        <div className="card-sub">Where the average student's money goes each month</div>
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value" labelLine={false} label={<CustomLabel />}>
                                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-title">Budget Tiers</div>
                        <div className="card-sub">Three reference points for monthly spending</div>
                        <div className="tier-row">
                            {BUDGET_TIERS.map((t, i) => (
                                <div key={i} className="tier-item">
                                    <div className="tier-header">
                                        <span className="tier-name" style={{ color: t.accent }}>{t.name}</span>
                                        <span className="tier-range">{t.range}</span>
                                    </div>
                                    <p className="tier-desc">{t.description}</p>
                                    <div className="tier-bar-track">
                                        <div className="tier-bar-fill" style={{ width: `${(t.monthly / 1400) * 100}%`, backgroundColor: t.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rent Trends */}
                <div className="card" style={{ marginBottom: 32 }}>
                    <div className="card-title">Rent Price Trends 2019–2024</div>
                    <div className="card-sub">Average monthly rent for student accommodation (WG room)</div>
                    <div style={{ height: 280, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={RENT_TRENDS} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <YAxis tickFormatter={v => `€${v}`} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} formatter={v => [`€${v}`, '']} />
                                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 13 }} />
                                {[['munich', 'Munich', '#dc2626'], ['berlin', 'Berlin', '#1d4ed8'], ['leipzig', 'Leipzig', '#059669'], ['avg', 'National Avg.', '#d1d5db']].map(([k, n, c]) => (
                                    <Line key={k} type="monotone" dataKey={k} name={n} stroke={c} strokeWidth={k === 'avg' ? 1.5 : 2.5} strokeDasharray={k === 'avg' ? '5 4' : undefined} dot={k !== 'avg' ? { r: 3, fill: c, stroke: '#fff', strokeWidth: 2 } : false} activeDot={k !== 'avg' ? { r: 6 } : false} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tips + Work */}
                <div className="grid-2" style={{ marginBottom: 32 }}>
                    <div className="card">
                        <div className="card-title">Cost-Reduction Strategies</div>
                        <div className="card-sub">Practical ways to lower monthly expenses</div>
                        {MONEY_SAVING_TIPS.slice(0, 7).map((t, i) => (
                            <div key={i} className="tip-row">
                                <div className="tip-num">{i + 1}</div>
                                <div className="tip-text">
                                    <div className="tip-main">{t.tip}</div>
                                    <div className="tip-impact">{t.impact}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card">
                            <div className="card-title">Working While Studying</div>
                            <div className="card-sub" style={{ marginBottom: 16 }}>Key figures for student employment in Germany</div>
                            <div className="work-grid">
                                {[['120', 'Full Days / Year'], ['€538', 'Monthly Tax-Free Limit'], ['€12.41', 'Min. Wage / Hour'], ['20 h', 'Max. Weekly Hours']].map(([v, l], i) => (
                                    <div key={i} className="work-stat">
                                        <div className="work-stat-val">{v}</div>
                                        <div className="work-stat-lbl">{l}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 14, padding: '12px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                                <strong>Non-EU students</strong> may work 120 full days or 240 half-days per year. Self-employment typically requires prior authorization from the Foreigners' Authority.
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-title">Regional Cost Differences</div>
                            <div className="card-sub" style={{ marginBottom: 14 }}>East vs. West Germany at a glance</div>
                            <div className="region-grid">
                                <div className="region-card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Eastern States</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46' }}>20–40% cheaper</div>
                                    <div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>Lower rent, services & dining</div>
                                </div>
                                <div className="region-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Western States</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>Higher salaries</div>
                                    <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 4 }}>More industry & job hubs</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resources + Glossary */}
                <div className="grid-2">
                    <div className="card">
                        <div className="card-title">Essential Resources</div>
                        <div className="card-sub" style={{ marginBottom: 16 }}>Recommended platforms for students in Germany</div>
                        {[
                            { title: 'Housing Search', sites: ['WG-Gesucht.de', 'ImmobilienScout24', 'Studierendenwerk'], icon: '⌂' },
                            { title: 'Health Insurance', sites: ['Check24', 'Verivox', 'TK', 'AOK'], icon: '+' },
                            { title: 'Student Employment', sites: ['Studentenjob.de', 'Jobmensa', 'Indeed'], icon: '≡' },
                            { title: 'Scholarships & Funding', sites: ['Scholarships', 'BAföG Office', 'Stipendienlotse'], icon: '◆' },
                        ].map((r, i) => (
                            <div key={i} className="resource-row">
                                <div className="resource-icon">{r.icon}</div>
                                <div>
                                    <div className="resource-title">{r.title}</div>
                                    <div className="resource-sites">{r.sites.map((s, j) => <span key={j} className="resource-site">{s}</span>)}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-title">Key German Rental Terms</div>
                        <div className="card-sub" style={{ marginBottom: 8 }}>Vocabulary every student needs to understand</div>
                        {[
                            { de: 'Warmmiete', en: 'Total rent including heating & utilities' },
                            { de: 'Kaltmiete', en: 'Base rent excluding additional costs' },
                            { de: 'Kaution', en: 'Security deposit — typically 2–3 months\' rent' },
                            { de: 'Nebenkosten', en: 'Utilities and service charges' },
                            { de: 'WG (Wohngemeinschaft)', en: 'Shared flat / apartment' },
                            { de: 'Zweckentfremdung', en: 'Illegal subletting — prohibited in most cities' },
                            { de: 'Wohnberechtigungsschein', en: 'Housing entitlement certificate for social housing' },
                        ].map((g, i) => (
                            <div key={i} className="glossary-row">
                                <span className="glossary-de">{g.de}</span>
                                <span className="glossary-en">{g.en}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const StatesTab = () => {
        const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });
        const [expandedRow, setExpandedRow] = useState(null);

        const enriched = useMemo(() => {
            let data = GERMAN_STATES.map(getEnrichedState);
            data.sort((a, b) => {
                let va = sortConfig.key === 'name' ? a.name : sortConfig.key === 'costIndex' ? a.costIndex : a.breakdown[sortConfig.key] || a.breakdown.total;
                let vb = sortConfig.key === 'name' ? b.name : sortConfig.key === 'costIndex' ? b.costIndex : b.breakdown[sortConfig.key] || b.breakdown.total;
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
            return data;
        }, [sortConfig]);

        const sort = (k) => setSortConfig(c => ({ key: k, direction: c.key === k && c.direction === 'asc' ? 'desc' : 'asc' }));
        const SortIcon = ({ col }) => <span style={{ marginLeft: 4, opacity: sortConfig.key === col ? 1 : 0.3, fontSize: 11 }}>{sortConfig.key === col ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>;

        return (
            <div className="fade-in">
                {/* State cards */}
                <div className="grid-3" style={{ marginBottom: 32 }}>
                    {GERMAN_STATES.map(s => {
                        const e = getEnrichedState(s);
                        return (
                            <div key={s.id} className="state-card">
                                <div className="state-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="state-abbreviation" style={{ background: s.color }}>{s.name.substring(0, 2)}</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{s.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--ink-60)' }}>{s.cities.length} major cities</div>
                                        </div>
                                    </div>
                                    <div className="state-total">
                                        <div className="state-total-label">Monthly Est.</div>
                                        <div className="state-total-val">{fmt(e.breakdown.total)}</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', color: 'var(--ink-60)', marginBottom: 6 }}>
                                    <span>Avg. Rent</span>
                                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{fmt(e.breakdown.rent)}</span>
                                </div>
                                <div style={{ height: 4, background: 'var(--ink-10)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                                    <div style={{ height: '100%', width: `${(e.breakdown.rent / 800) * 100}%`, background: s.color, borderRadius: 4 }} />
                                </div>
                                <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', color: 'var(--ink-60)', marginBottom: 14 }}>
                                    <span>Cost Index</span>
                                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.costIndex}</span>
                                </div>
                                <div className="state-cities">
                                    {s.cities.slice(0, 3).map((c, i) => <span key={i} className="state-city-tag">{c}</span>)}
                                    {s.cities.length > 3 && <span className="state-city-tag">+{s.cities.length - 3}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Data table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                        <div className="card-title">Detailed State Comparison</div>
                        <p style={{ fontSize: 13, color: 'var(--ink-60)', margin: '4px 0 0' }}>Click any row to expand full cost breakdown. Columns are sortable.</p>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th onClick={() => sort('name')}>State <SortIcon col="name" /></th>
                                    <th className="right" onClick={() => sort('rent')}>Avg. Rent <SortIcon col="rent" /></th>
                                    <th className="right" onClick={() => sort('groceries')}>Groceries <SortIcon col="groceries" /></th>
                                    <th className="right hide-sm">Transport</th>
                                    <th className="right hide-sm">Health Ins.</th>
                                    <th className="right highlight" onClick={() => sort('total')}>Total Est. <SortIcon col="total" /></th>
                                    <th style={{ width: 32 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {enriched.map(s => (
                                    <React.Fragment key={s.id}>
                                        <tr className={expandedRow === s.id ? 'expanded' : ''} onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}>
                                            <td><span className="state-dot" style={{ background: s.color }} />{s.name}</td>
                                            <td className="right" style={{ fontWeight: 600 }}>{fmt(s.breakdown.rent)}</td>
                                            <td className="right muted">{fmt(s.breakdown.groceries)}</td>
                                            <td className="right muted hide-sm">{fmt(s.breakdown.transport)}</td>
                                            <td className="right muted hide-sm">{fmt(s.breakdown.health)}</td>
                                            <td className="right highlight">{fmt(s.breakdown.total)}</td>
                                            <td style={{ color: 'var(--ink-60)', fontSize: 11, textAlign: 'center' }}>{expandedRow === s.id ? '▼' : '▶'}</td>
                                        </tr>
                                        {expandedRow === s.id && (
                                            <tr className="expand-row">
                                                <td colSpan="7">
                                                    <div className="expand-inner">
                                                        <div className="expand-grid">
                                                            <div>
                                                                <div className="expand-label">Cost Breakdown — {s.name}</div>
                                                                {[['Accommodation (WG / Dorm)', s.breakdown.rent], ['Food & Groceries', s.breakdown.groceries], ['Health Insurance', s.breakdown.health], ['Transport (Deutschland-Ticket)', s.breakdown.transport], ['Leisure & Miscellaneous', s.breakdown.leisure + s.breakdown.misc]].map(([l, v], i) => (
                                                                    <div key={i} className="breakdown-row">
                                                                        <span style={{ color: 'var(--ink-60)', fontSize: 13 }}>{l}</span>
                                                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(v)}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="breakdown-row total">
                                                                    <span>Total Monthly Estimate</span>
                                                                    <span>{fmt(s.breakdown.total)}</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="expand-label">Major Student Cities</div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                                                                    {s.cities.map((c, i) => (
                                                                        <div key={i} style={{ padding: '9px 12px', background: '#fff', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--ink)', textAlign: 'center' }}>{c}</div>
                                                                    ))}
                                                                </div>
                                                                <div className="expand-label">Quick Facts</div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                                    <div style={{ padding: 14, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Cost Index</div>
                                                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1e3a8a' }}>{s.costIndex}</div>
                                                                        <div style={{ fontSize: 11, color: '#1d4ed8' }}>National avg = 100</div>
                                                                    </div>
                                                                    <div style={{ padding: 14, background: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Universities</div>
                                                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#4c1d95' }}>{s.universities}</div>
                                                                        <div style={{ fontSize: 11, color: '#7c3aed' }}>Institutions</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const CitiesTab = () => {
        const sorted = [...CITIES_DATA].sort((a, b) => a.total - b.total);

        return (
            <div className="fade-in">
                {/* City selector */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-title" style={{ marginBottom: 4 }}>City Comparison</div>
                    <p style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 14 }}>Select up to 4 cities to compare side-by-side</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {CITIES_DATA.slice(0, 15).map(c => (
                            <span key={c.name} className={`chip ${selectedCities.includes(c.name) ? 'selected' : ''}`}
                                onClick={() => {
                                    if (selectedCities.includes(c.name)) setSelectedCities(selectedCities.filter(x => x !== c.name));
                                    else if (selectedCities.length < 4) setSelectedCities([...selectedCities, c.name]);
                                }}>{c.name}</span>
                        ))}
                    </div>
                </div>

                {/* Comparison table */}
                {selectedCities.length >= 2 && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
                            <div className="card-title">Side-by-Side Comparison</div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        {selectedCities.map((n, i) => <th key={n} className="right" style={{ color: PALETTE[i] }}>{n}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {['rent', 'groceries', 'dining', 'leisure', 'total'].map(f => {
                                        const vals = selectedCities.map(n => (CITIES_DATA.find(c => c.name === n) || {})[f] || 0);
                                        const min = Math.min(...vals);
                                        return (
                                            <tr key={f}>
                                                <td style={{ fontWeight: f === 'total' ? 700 : 500, textTransform: f === 'total' ? 'none' : 'capitalize' }}>{f === 'total' ? 'Total Monthly' : f}</td>
                                                {selectedCities.map((n, i) => {
                                                    const v = vals[i];
                                                    const lowest = v === min && vals.filter(x => x === min).length === 1;
                                                    return <td key={n} className="right" style={{ fontWeight: f === 'total' ? 700 : 500, color: lowest ? 'var(--green)' : 'var(--ink)' }}>{fmt(v)}{lowest && <span style={{ marginLeft: 4, fontSize: 10 }}>↓</span>}</td>;
                                                })}
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td style={{ color: 'var(--ink-60)', fontSize: 13 }}>Cost Index</td>
                                        {selectedCities.map(n => {
                                            const c = CITIES_DATA.find(x => x.name === n);
                                            const idx = c ? c.costIndex : 100;
                                            return <td key={n} className="right" style={{ color: idx > 100 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{idx > 100 ? '+' : ''}{idx - 100}%</td>;
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Horizontal bar chart */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-title">Cities by Monthly Cost</div>
                    <div className="card-sub">Total rent + essentials (sorted by affordability)</div>
                    <div style={{ height: 420 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sorted.slice(0, 15)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tickFormatter={v => `€${v}`} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(v, n) => [`€${v}`, n]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
                                <Bar dataKey="rent" name="Rent" stackId="a" fill="#1d4ed8" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="groceries" name="Groceries" stackId="a" fill="#059669" />
                                <Bar dataKey="dining" name="Dining" stackId="a" fill="#d97706" />
                                <Bar dataKey="leisure" name="Leisure" stackId="a" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* City cards */}
                <div className="grid-3">
                    {sorted.slice(0, 12).map((c, i) => (
                        <div key={c.name} className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <span className={`badge ${i < 4 ? 'badge-green' : i < 8 ? 'badge-amber' : 'badge-red'}`}>
                                    #{i + 1} {i < 4 ? 'Affordable' : i < 8 ? 'Moderate' : 'Expensive'}
                                </span>
                                <span style={{ fontSize: 20, fontWeight: 700 }}>{fmt(c.total)}</span>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-60)', marginBottom: 14 }}>{c.state}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {[['Rent', c.rent], ['Groceries', c.groceries]].map(([l, v]) => (
                                    <div key={l} style={{ padding: '9px 12px', background: 'var(--ink-10)', borderRadius: 6 }}>
                                        <div style={{ fontSize: 11, color: 'var(--ink-60)', marginBottom: 3 }}>{l}</div>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(v)}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-60)' }}>
                                <span>{(c.studentPop / 1000).toFixed(0)}k students enrolled</span>
                                <span>Popularity {c.popularity}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const CategoriesTab = () => {
        const cats = [
            { name: 'Housing', avg: '€450 avg.', items: [['WG Room (Shared)', '€350–500'], ['Studio Apartment', '€600–900'], ['Utilities', 'See contract'], ['Internet', '€30–45']] },
            { name: 'Food & Groceries', avg: '€200 avg.', items: [['Discount Supermarket', 'Aldi / Lidl / Netto'], ['University Mensa', '€3–5 / meal'], ['Restaurant', '€12–20'], ['Coffee (café)', '€2.50–4.00']] },
            { name: 'Transportation', avg: '€49 avg.', items: [['Deutschland-Ticket', '€49 / month'], ['Semester Ticket', 'Included in fees'], ['Bike rental', '€10–20 / month'], ['Train (ICE)', 'Varies — book early']] },
            { name: 'Health & Insurance', avg: '€120 avg.', items: [['Public Health Insurance', '€120–130'], ['Liability Insurance', '€5 / month'], ['Prescription co-pay', '€5–10'], ['Dental cleaning', '€50–120']] },
            { name: 'Leisure & Lifestyle', avg: '€100 avg.', items: [['Gym (commercial)', '€20–40'], ['Cinema (student)', '€10–15'], ['Streaming services', '€10–18'], ['Mobile plan', '€10–30']] },
            { name: 'Study Materials', avg: '€30 avg.', items: [['Semester contribution', '€150–350 / semester'], ['Textbooks', 'Varies (library available)'], ['Printing & copying', '€5–10'], ['Software', 'Usually free via uni']] },
        ];

        return (
            <div className="fade-in">
                <div className="grid-3">
                    {cats.map((c, i) => (
                        <div key={i} className="cat-card">
                            <div className="cat-header">
                                <span className="cat-name">{c.name}</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="cat-avg-label">Monthly</div>
                                    <div className="cat-avg">{c.avg}</div>
                                </div>
                            </div>
                            {c.items.map(([n, v], j) => (
                                <div key={j} className="cat-item">
                                    <span className="cat-item-name">{n}</span>
                                    <span className="cat-item-val">{v}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 24 }}>
                    <div className="card">
                        <div className="card-title">Monthly Breakdown by Budget Level</div>
                        <div className="card-sub">How spending per category shifts across Essential → Comfortable → Relaxed lifestyles</div>
                        <div style={{ height: 340 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={MONTHLY_BREAKDOWN} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={v => `€${v}`} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} formatter={v => [`€${v}`, '']} />
                                    <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
                                    <Bar dataKey="survival" name="Essential" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="comfortable" name="Balanced" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="relaxed" name="Comfortable" fill="#10b981" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const CalculatorTab = () => {
        const budgetPieData = [
            { name: 'Rent', value: calculatedBudget.rent },
            { name: 'Food', value: calculatedBudget.food },
            { name: 'Insurance', value: calculatedBudget.insurance },
            { name: 'Transport', value: calculatedBudget.transport },
            { name: 'Phone', value: calculatedBudget.phone },
            { name: 'Leisure', value: calculatedBudget.leisure },
            { name: 'Personal', value: calculatedBudget.personal },
            { name: 'Misc', value: calculatedBudget.misc }
        ];

        return (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                    <style>{`@media(min-width:900px){.calc-layout{grid-template-columns:1fr 420px !important;}}`}</style>
                    <div className="calc-layout" style={{ display: 'grid', gap: 24 }}>
                        {/* Controls */}
                        <div className="card card-lg">
                            <div className="card-title" style={{ fontSize: 20, marginBottom: 4 }}>Budget Estimator</div>
                            <p style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 28 }}>Adjust the parameters below to estimate your monthly cost of living.</p>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-60)', display: 'block', marginBottom: 10 }}>Target City</label>
                                <select className="calc-select" value={calcCity} onChange={e => setCalcCity(e.target.value)}>
                                    {CITIES_DATA.map(c => <option key={c.name} value={c.name}>{c.name} ({c.state}) — Index {c.costIndex}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-60)', display: 'block', marginBottom: 10 }}>Housing Type</label>
                                <div className="option-grid-3">
                                    {[['dorm', 'Dormitory', 'Most affordable'], ['wg', 'Shared Flat (WG)', 'Most common'], ['studio', 'Studio Apt.', 'Most private']].map(([id, l, d]) => (
                                        <button key={id} className={`option-btn ${calcAccommodation === id ? 'active' : ''}`} onClick={() => setCalcAccommodation(id)}>
                                            <span className="option-label">{l}</span>
                                            <span className="option-desc">{d}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-60)', display: 'block', marginBottom: 10 }}>Lifestyle Level</label>
                                <div className="option-grid-3">
                                    {[['budget', 'Frugal', 'Minimal extras'], ['comfortable', 'Standard', 'Balanced spending'], ['relaxed', 'Relaxed', 'More flexibility']].map(([id, l, d]) => (
                                        <button key={id} className={`option-btn ${calcLifestyle === id ? 'active' : ''}`} onClick={() => setCalcLifestyle(id)}>
                                            <span className="option-label">{l}</span>
                                            <span className="option-desc">{d}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-60)', display: 'block', marginBottom: 10 }}>Dining Habits</label>
                                <div className="option-grid-2">
                                    {[['always', 'Cook at Home', 'Rarely eat out'], ['mostly', 'Mostly Cook', '1–2× dining out per week'], ['sometimes', 'Mixed', '3–4× dining out per week'], ['rarely', 'Mostly Dining Out', 'Limited home cooking']].map(([id, l, d]) => (
                                        <button key={id} className={`option-btn ${calcCooking === id ? 'active' : ''}`} onClick={() => setCalcCooking(id)}>
                                            <span className="option-label">{l}</span>
                                            <span className="option-desc">{d}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Result panel */}
                        <div>
                            <div className="result-panel" style={{ marginBottom: 20 }}>
                                <div className="result-label">Estimated Monthly Budget</div>
                                <div className="result-total">{fmt(calculatedBudget.total)}</div>
                                <div className="result-city">{calcCity}</div>
                                {[
                                    ['#3b82f6', 'Rent', calculatedBudget.rent],
                                    ['#10b981', 'Food & Dining', calculatedBudget.food + calculatedBudget.leisure],
                                    ['#f59e0b', 'Fixed Costs', calculatedBudget.insurance + calculatedBudget.transport + calculatedBudget.phone],
                                    ['#8b5cf6', 'Personal & Misc', calculatedBudget.personal + calculatedBudget.misc],
                                ].map(([col, l, v], i) => (
                                    <div key={i} className="result-line">
                                        <div className="result-line-label"><span className="result-dot" style={{ background: col }} />{l}</div>
                                        <div className="result-line-val">{fmt(v)}</div>
                                    </div>
                                ))}
                                <div className="result-note">
                                    Most students in {calcCity} spend {fmt(Math.round(calculatedBudget.total * 0.9))}–{fmt(Math.round(calculatedBudget.total * 1.1))} per month. Budget an additional €80–100 buffer for unexpected costs.
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 4, textAlign: 'center' }}>Cost Breakdown</div>
                                <div style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={budgetPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                                {budgetPieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} strokeWidth={0} />)}
                                            </Pie>
                                            <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                                    {budgetPieData.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                                            <span style={{ color: 'var(--ink-60)' }}>{d.name}</span>
                                            <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{fmt(d.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const TABS = [
        { id: 'overview', label: 'Overview', svg: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg> },
        { id: 'states', label: 'By State', svg: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12L6 4l3 5 2-3 2 6" /></svg> },
        { id: 'cities', label: 'By City', svg: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 15c0-3.3 2.7-6 6-6s6 2.7 6 6H2z" /></svg> },
        { id: 'categories', label: 'Categories', svg: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h12M2 12h8" /></svg> },
        { id: 'calculator', label: 'Calculator', svg: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="12" height="14" rx="2" /><path d="M5 5h6M5 8h2M9 8h2M5 11h2M9 11h2" /></svg> },
    ];

    const tabContent = { overview: <OverviewTab />, states: <StatesTab />, cities: <CitiesTab />, categories: <CategoriesTab />, calculator: <CalculatorTab /> };

    return (
        <div className="gcl-wrap">
            <style>{styles}</style>

            {/* Hero */}
            <div className="gcl-hero">
                <div className="container">
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 40 }}>
                                <div>
                                    <div className="hero-eyebrow">
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="#22d3ee"><circle cx="4" cy="4" r="4" /></svg>
                                        Updated for 2024–25 Academic Year
                                    </div>
                                    <h1 className="hero-title">Cost of Living<br /><em>in Germany</em></h1>
                                    <p className="hero-sub">A comprehensive financial guide for international students — covering expenses across all 16 federal states and major university cities.</p>
                                </div>
                                <div className="currency-row">
                                    <span className="currency-label">Currency</span>
                                    <select className="currency-select" value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
                                        {Object.keys(CURRENCY_RATES).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="kpi-strip">
                                {[
                                    { label: 'Avg. Monthly Budget', value: fmt(950), sub: 'All-in student estimate' },
                                    { label: 'Most Affordable City', value: 'Chemnitz', sub: `${fmt(608)} / month` },
                                    { label: 'Most Expensive City', value: 'Munich', sub: `${fmt(1150)} / month` },
                                    { label: 'States Covered', value: '16 States', sub: '400+ universities' },
                                ].map((k, i) => (
                                    <div key={i} className="kpi-item">
                                        <div className="kpi-label">{k.label}</div>
                                        <div className="kpi-value">{k.value}</div>
                                        <div className="kpi-sub">{k.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab nav */}
            <div className="tab-nav">
                <div className="container">
                    <div className="tab-list">
                        {TABS.map(t => (
                            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                                <svg className="tab-icon" viewBox="0 0 16 16">{t.svg.props.children}</svg>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
                {tabContent[activeTab] || <OverviewTab />}
            </div>
        </div>
    );
};

export default GermanyCostOfLiving;