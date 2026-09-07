export default function bot({ history, memory }) {
  try {
    const C = "C", D = "D"
    if (!memory || memory.v !== 600) {
      memory = { v: 600, oppC: 0, oppD: 0, aC: [0, 0], aD: [0, 0],
        dStreak: 0, cStreak: 0, punish: 0, calm: 0,
        antiFarm: false, maybeCorn: false, cornLock: false,
        periodD: false, periodCheck: -20, dWindow: [0,0,0,0,0,0,0,0] }
    }
    const m = memory
    const n = history.length
    if (n === 0) return [C, m]
    if (n === 1) return [C, m]
    if (n === 2) {
      // corn/praesidium fingerprint: their r1=C, r2=D → our C,C,D locks them to cooperation
      if (history[0].opponent === C && history[1].opponent === D) { m.maybeCorn = true; return [D, m] }
      return [C, m]
    }
    if (n === 3 && m.maybeCorn && history[2].opponent === C) m.cornLock = true

    const last = history[n - 1]
    const myPrev = history[n - 2].you
    if (last.opponent === C) { m.oppC++; m.cStreak++; m.dStreak = 0 }
    else { m.oppD++; m.dStreak++; m.cStreak = 0 }
    // 8-round D-window (goat-style radar)
    m.dWindow.push(last.opponent === D ? 1 : 0)
    if (m.dWindow.length > 8) m.dWindow.shift()
    const dIn8 = m.dWindow.reduce((a, b) => a + b, 0)
    if (myPrev === C) { m.aC[1]++; if (last.opponent === C) m.aC[0]++ }
    else { m.aD[1]++; if (last.opponent === C) m.aD[0]++ }

    // ---- PERIODICITY ----
    if (n - m.periodCheck >= 14 && n >= 20) {
      m.periodCheck = n
      const L = Math.min(28, n), from = n - L
      const dR = history.slice(from, n).filter(r => r.opponent === D).length / L
      if (dR > 0.1 && dR < 0.9) {
        let bestP = 0
        for (let p = 2; p <= 8; p++) {
          let ok = true, checks = 0
          for (let i = from + p; i < n; i++) { checks++; if (history[i].opponent !== history[i - p].opponent) { ok = false; break } }
          if (ok && checks >= 12) { bestP = p; break }
        }
        if (bestP > 0) {
          let reactive = 0, tot = 0
          for (let i = Math.max(1, from); i < n; i++) { tot++; if (history[i].opponent === history[i - 1].you) reactive++ }
          if (tot > 0 && reactive / tot > 0.8) bestP = 0
        }
        m.periodD = bestP > 0
      }
    }

    // ---- HARD MODES ----
    // pure defector: D-lock with rare reform probes
    if (m.oppC === 0 && n >= 4) { if (n % 30 === 29) return [C, m]; return [D, m] }
    // periodic → D
    if (m.periodD && m.oppD / n > 0.15) return [n % 20 === 19 ? C : D, m]
    // corn/praesidium farm
    if (m.cornLock) {
      if (n >= 8 && history.slice(Math.max(4, n - 6), n).every(r => r.opponent === D)) m.cornLock = false
      else return [n % 12 === 11 ? C : D, m]
    }
    // anti-correlated (reverse-TFT family): farm with all-D
    if (n >= 10 && m.aC[1] >= 5 && m.aD[1] >= 3) {
      const pC = m.aC[0] / m.aC[1], pD = m.aD[0] / m.aD[1]
      if (pC <= 0.3 && pD >= 0.7) m.antiFarm = true
      else if (m.antiFarm && (pD < 0.5 || pC > 0.5)) m.antiFarm = false
    }
    if (m.antiFarm) return [n % 13 === 12 ? C : D, m]

    // ---- CONDITIONAL RESPONSES ----
    const pCafterC = m.aC[1] >= 6 ? m.aC[0] / m.aC[1] : null
    const pCafterD = m.aD[1] >= 4 ? m.aD[0] / m.aD[1] : null
    // TF2T-forgiver: alternate
    if (pCafterC !== null && pCafterD !== null && pCafterC >= 0.75 && pCafterD >= 0.55 && m.oppD / n < 0.35) {
      if (m.dStreak === 0) return [n % 2 === 1 ? D : C, m]
      return [C, m]
    }
    // random → D (rare keeps)
    if (n >= 16 && pCafterC !== null && pCafterD !== null && Math.abs(pCafterC - pCafterD) < 0.22 && m.oppD / n > 0.18 && m.oppD / n < 0.85) {
      return [n % 20 === 19 ? C : D, m]
    }
    if (n >= 12 && m.oppD / n > 0.3 && m.oppD / n < 0.8 && m.dStreak < 3 && m.cStreak < 5 && pCafterC === null) {
      return [D, m]
    }
    // extortioner / non-cooperative responsive → D (F2: threshold 0.45)
    if (n >= 25 && m.oppD / n > 0.45) return [n % 20 === 19 ? C : D, m]

    // ---- CORE: probe-tolerant gradual (F1) ----
    if (m.punish > 0) { m.punish--; return [D, m] }
    if (m.calm > 0) { m.calm--; return [C, m] }
    if (last.opponent === D) {
      if (myPrev === D) { m.calm = 1; return [C, m] } // contrition
      if (dIn8 >= 2 || m.oppD / n > 0.25) {
        // repeated/reckless defection: gradual punishment
        m.punish = Math.min(m.oppD, 3) - 1
        m.calm = 2
        return [D, m]
      }
      // F1: isolated probe → single D + calm (pumpkin-safe)
      m.calm = 2
      return [D, m]
    }
    return [C, m]
  } catch (e) { return ["C", null] }
}