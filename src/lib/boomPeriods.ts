/** Calendar month key e.g. `2026-05` for BOOM monthly self-assessment. */
export function defaultMonthPeriod(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Fiscal quarter label e.g. `2026-Q1` for quarterly BOOM forms. */
export function defaultQuarterPeriod(d = new Date()): string {
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${y}-Q${q}`;
}

export function quarterOptions(countPast = 4, countFuture = 1, d = new Date()): string[] {
  const out: string[] = [];
  const centerYear = d.getFullYear();
  const centerQ = Math.floor(d.getMonth() / 3) + 1;
  let y = centerYear;
  let q = centerQ;
  for (let i = 0; i < countPast; i++) {
    out.unshift(`${y}-Q${q}`);
    q--;
    if (q < 1) {
      q = 4;
      y--;
    }
  }
  y = centerYear;
  q = centerQ;
  const forward: string[] = [];
  for (let i = 0; i < countFuture; i++) {
    q++;
    if (q > 4) {
      q = 1;
      y++;
    }
    forward.push(`${y}-Q${q}`);
  }
  return [...out, ...forward];
}

export function monthOptions(monthsBack = 6, monthsAhead = 1, d = new Date()): string[] {
  const out: string[] = [];
  const cur = new Date(d.getFullYear(), d.getMonth(), 1);
  for (let i = monthsBack; i >= 0; i--) {
    const dt = new Date(cur.getFullYear(), cur.getMonth() - i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  }
  for (let i = 1; i <= monthsAhead; i++) {
    const dt = new Date(cur.getFullYear(), cur.getMonth() + i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}
