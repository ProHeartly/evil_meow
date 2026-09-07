export default function bot(state) {
  const C = "C", D = "D";
  const CFG = {
    window: 30,          // stable conditional rates
    tolerate: 2,         // much shorter opening absorption
    coopFloor: 0.60,     // P(they C | we C) below which we become hard
    exploitFloor: 0.70,  // P(they C | we D) above which we exploit
    olives: [4, 12, 30, 70, 150], // earlier first olive, spaced out
    maxSucker: 6,        // allow a few unpunished defections
    maxExits: 3          // multiple chances to leave hard mode
  };
  let hist = null;

  try {
    const raw = state && Array.isArray(state.history) ? state.history : [];
    const n = raw.length;
    hist = raw;
    const m = loadMem(state ? state.memory : null);
    if (n === 0) return out(C, m);

    /* ---------- single statistics pass ---------- */
    let oppD = 0, myD = 0, cAfterC = 0, nAfterC = 0, cAfterD = 0, nAfterD = 0;
    let sucker = 0, recPts = 0, recN = 0;
    const w0 = n - CFG.window > 0 ? n - CFG.window : 0;
    const s0 = n - 10 > 0 ? n - 10 : 0;
    for (let i = 0; i < n; i++) {
      const o = opp(i), y = you(i);
      if (o === D) oppD++;
      if (y === D) myD++;
      if (i >= w0 && i > 0) {
        if (you(i - 1) === C) { nAfterC++; if (o === C) cAfterC++; }
        else { nAfterD++; if (o === C) cAfterD++; }
      }
      if (i >= s0) {
        if (y === C && o === D) sucker++;
        recN++; recPts += y === C ? (o === C ? 2 : 0) : (o === C ? 3 : 1);
      }
    }
    let mutualD = 0;
    for (let i = n - 1; i >= 0 && you(i) === D && opp(i) === D; i--) mutualD++;
    let mutualC = 0;
    for (let i = n - 1; i >= 0 && you(i) === C && opp(i) === C; i--) mutualC++;
    if (mutualC >= 8) m.olive = 0;          // peace restored: refill the budget
    const pC = (cAfterC + 0.5) / (nAfterC + 1);   // they cooperate when we cooperate
    const pD = (cAfterD + 0.5) / (nAfterD + 1);   // they cooperate even when we defect
    const oppRate = oppD / n;
    const vNow = recN ? recPts / recN : 2;

    const lastOpp = opp(n - 1), lastYou = you(n - 1);
    const prevYou = n >= 2 ? you(n - 2) : C;

    /* ---------- 1. pure defector detection ---------- */
    // If opponent has never cooperated and we are past the tolerance window,
    // stop wasting points and defect immediately.
    if (oppD === n && n > CFG.tolerate) return out(D, m);

    /* ---------- 2. absorb a hostile opening ---------- */
    if (opp(0) === D && myD === 0) {
      let seenC = false, relapse = false;
      for (let i = 0; i < n; i++) {
        if (opp(i) === C) seenC = true;
        else if (seenC) { relapse = true; break; }
      }
      if (!relapse && (n <= CFG.tolerate || lastOpp === C)) return out(C, m);
    }

    /* ---------- 3. never disturb a clean relationship ---------- */
    if (oppD === 0) return out(C, m);

    /* ---------- 4. fixed patterns that ignore us ---------- */
    if (isPeriodic(n)) return out(D, m);

    /* ---------- 5. they don't punish defection: take it ---------- */
    if (nAfterD >= 3 && pD >= CFG.exploitFloor && oppRate < 0.35 && lastYou === C) {
      return out(D, m);
    }

    /* ---------- 6. hostile classification, and it sticks ---------- */
    const unresponsive = nAfterC >= 4 && nAfterD >= 3 &&
                         Math.abs(pC - pD) < 0.25 && oppRate > 0.2;
    const parasitic = (nAfterC >= 4 && pC < CFG.coopFloor) ||
                      (n >= 12 && sucker >= CFG.maxSucker) ||
                      (n >= 10 && oppRate > 0.85);
    if (unresponsive || parasitic) {
      m.hard = 1;
      if (unresponsive) m.unresp = 1;
    }

    if (m.hard) {
      if (m.oliveAt >= 0) {
        if (n < m.oliveAt + 2) return out(C, m);
        const taken = opp(m.oliveAt + 1) === C;
        m.oliveAt = -1;
        if (taken && m.exits < CFG.maxExits) {
          m.exits++; m.hard = 0; m.unresp = 0; m.olive = 0;
          return out(C, m);
        }
      }
      const need = 4;   // shorter exit requirement – recover faster
      if (m.exits < CFG.maxExits && n >= need) {
        let allC = true;
        for (let i = n - need; i < n; i++) if (opp(i) !== C) { allC = false; break; }
        if (allC) {
          m.exits++; m.hard = 0; m.unresp = 0; m.olive = 0;
          return out(C, m);
        }
      }
      if (!m.unresp && m.exits < CFG.maxExits && oppD < n &&
          m.olive < CFG.olives.length && mutualD >= CFG.olives[m.olive]) {
        m.olive++; m.oliveAt = n;
        return out(C, m);
      }
      return out(D, m);
    }

    /* ---------- 7. core: strict, contrite tit-for-tat ---------- */
    if (lastOpp === D) {
      if (lastYou === D) {
        if (m.olive < CFG.olives.length && mutualD >= CFG.olives[m.olive]) {
          m.olive++;
          return out(C, m);
        }
        return out(D, m);
      }
      if (prevYou === D) return out(C, m);
      return out(D, m);
    }
    return out(C, m);

  } catch (err) {
    try {
      const hs = state && state.history;
      const l = hs && hs.length ? hs[hs.length - 1] : null;
      const v = l && l.opponent;
      return [typeof v === "string" && v.charAt(0).toUpperCase() === "D" ? "D" : "C",
              (state && state.memory) || null];
    } catch (e2) { return ["C", null]; }
  }

  function isPeriodic(n) {
    if (n < 12) return false;
    const from = n - 20 > 0 ? n - 20 : 0;
    let sawC = false, sawD = false;
    for (let i = from; i < n; i++) { if (opp(i) === C) sawC = true; else sawD = true; }
    if (!sawC || !sawD) return false;
    for (let p = 2; p <= 6; p++) {
      let ok = true, checks = 0;
      for (let i = from + p; i < n; i++) {
        checks++;
        if (opp(i) !== opp(i - p)) { ok = false; break; }
      }
      if (!ok || checks < 8) continue;
      for (let i = from > 1 ? from : 1; i < n; i++) if (opp(i) !== you(i - 1)) return true;
    }
    return false;
  }

  function mv(v) {
    if (v === D) return D;
    if (typeof v === "string" && v.length && v.charAt(0).toUpperCase() === "D") return D;
    return C;
  }
  function you(i) { const r = hist[i]; return r ? mv(r.you) : C; }
  function opp(i) { const r = hist[i]; return r ? mv(r.opponent) : C; }

  function loadMem(raw) {
    const base = { olive: 0, hard: 0, unresp: 0, exits: 0, oliveAt: -1 };
    if (raw && typeof raw === "object") {
      for (const k of ["olive", "hard", "unresp", "exits", "oliveAt"]) {
        const v = raw[k];
        if (typeof v === "number" && isFinite(v)) base[k] = v;
      }
      if (base.olive < 0) base.olive = 0;
    }
    return base;
  }
  function out(move, m) { return [move === D ? D : C, m]; }
}