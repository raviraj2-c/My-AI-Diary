function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const PAIRS = [
  { name: 'Light body text on page (#0A0A0A on #F8FAFC)', fg: '#0A0A0A', bg: '#F8FAFC', min: 4.5 },
  { name: 'Light body text on surface (#0A0A0A on #FFFFFF)', fg: '#0A0A0A', bg: '#FFFFFF', min: 4.5 },
  { name: 'Light muted text on page (#6B7280 on #F8FAFC)', fg: '#6B7280', bg: '#F8FAFC', min: 4.5 },
  { name: 'Light muted text on surface (#6B7280 on #FFFFFF)', fg: '#6B7280', bg: '#FFFFFF', min: 4.5 },
  { name: 'Primary button (#FFFFFF on #0369A1)', fg: '#FFFFFF', bg: '#0369A1', min: 4.5 },
  { name: 'Danger button (#FFFFFF on #DC2626)', fg: '#FFFFFF', bg: '#DC2626', min: 4.5 },
  { name: 'Sky-700 link on surface (#0369A1 on #FFFFFF)', fg: '#0369A1', bg: '#FFFFFF', min: 4.5 },
  { name: 'Sky-700 text on sky-50 (#0369A1 on #F0F9FF)', fg: '#0369A1', bg: '#F0F9FF', min: 4.5 },
  { name: 'Sky-700 text on sky-100 (#0369A1 on #E0F2FE)', fg: '#0369A1', bg: '#E0F2FE', min: 4.5 },
  { name: 'Ink text on sky-200 (#0A0A0A on #BAE6FD)', fg: '#0A0A0A', bg: '#BAE6FD', min: 4.5 },
  { name: 'Ink text on sky-400 (#0A0A0A on #38BDF8)', fg: '#0A0A0A', bg: '#38BDF8', min: 4.5 },
  { name: 'Dark body text on dark bg (#FFFFFF on #0A0A0A)', fg: '#FFFFFF', bg: '#0A0A0A', min: 4.5 },
  { name: 'Dark body text on dark surface (#FFFFFF on #171717)', fg: '#FFFFFF', bg: '#171717', min: 4.5 },
  { name: 'Dark muted text on dark surface (#9CA3AF on #171717)', fg: '#9CA3AF', bg: '#171717', min: 4.5 },
  { name: 'Dark accent sky-400 on dark surface (#38BDF8 on #171717)', fg: '#38BDF8', bg: '#171717', min: 4.5 },
  { name: 'Sky-500 icon/highlight on white (large/UI #0EA5E9 on #FFFFFF)', fg: '#0EA5E9', bg: '#FFFFFF', min: 2.7 },
];

let failed = false;
for (const p of PAIRS) {
  const ratio = contrastRatio(p.fg, p.bg);
  const ok = ratio >= p.min;
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${ratio.toFixed(2)}:1 (min ${p.min}:1) - ${p.name}`);
}
if (failed) process.exit(1);
