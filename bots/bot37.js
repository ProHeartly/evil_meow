export default function bot({ history, memory }) {
  const C = "C", D = "D";

  const freshMemory = () => ({
    oppC: 0, oppD: 0,
    recent: [],
    oppDefStreak: 0, oppCoopStreak: 0,
    ourScoreSum: 0,
    everWeDefected: false,
    logp: [0, 0, 0, 0, 0], // AllC, AllD, TFT, Pavlov, Grim
    hardLock: false,
    exploitLock: false,
    suppressRetaliation: 0,
    lastProbe: 0,
  });

  try {
    const n = history.length;

    if (!memory || typeof memory !== "object" || !Array.isArray(memory.logp)) {
      memory = freshMemory();
    }

    if (n === 0) return [C, memory]; // always open with cooperation

    const last = history[n - 1];
    const myLast = last.you === D ? D : C;
    const oppLast = last.opponent === D ? D : C;

    // --- running stats ---
    if (oppLast === C) {
      memory.oppC++; memory.oppCoopStreak++; memory.oppDefStreak = 0;
    } else {
      memory.oppD++; memory.oppDefStreak++; memory.oppCoopStreak = 0;
    }
    memory.recent.push(oppLast);
    if (memory.recent.length > 10) memory.recent.shift();

    const payoff =
      myLast === C && oppLast === C ? 2 :
      myLast === D && oppLast === C ? 3 :
      myLast === C && oppLast === D ? 0 : 1;
    memory.ourScoreSum += payoff;

    // --- Bayesian opponent classification (incremental, O(1)/round) ---
    const eps = 0.05;
    if (n >= 2) {
      const prev = history[n - 2];
      const prevYou = prev.you === D ? D : C;
      const prevOpp = prev.opponent === D ? D : C;

      const predAllC = C;
      const predAllD = D;
      const predTFT = prevYou;
      const predPavlov = prevYou === prevOpp ? prevOpp : (prevOpp === C ? D : C);
      const predGrim = memory.everWeDefected ? D : C;

      const preds = [predAllC, predAllD, predTFT, predPavlov, predGrim];
      for (let i = 0; i < 5; i++) {
        const p = preds[i] === oppLast ? (1 - eps) : eps;
        memory.logp[i] += Math.log(p);
      }
    }
    memory.everWeDefected = memory.everWeDefected || (myLast === D);

    // --- posterior over opponent archetype ---
    const maxLp = Math.max(...memory.logp);
    const exps = memory.logp.map(x => Math.exp(x - maxLp));
    const sumExp = exps.reduce((a, b) => a + b, 0);
    const post = exps.map(x => x / sumExp);
    const [pAllC, pAllD, , , pGrim] = post;
    const pHard = pAllD + pGrim;
    const pMax = Math.max(...post);

    const totalOppMoves = memory.oppC + memory.oppD;
    const oppDefectRate = totalOppMoves ? memory.oppD / totalOppMoves : 0;
    const avgPayoff = memory.ourScoreSum / n;
    const looksRandom = n >= 20 && pMax < 0.4 && oppDefectRate > 0.25 && oppDefectRate < 0.75;

    // 1. Hard-defector backstop (fast trigger on streaks, slower on stats)
    if (
      memory.oppDefStreak >= 3 ||
      (totalOppMoves >= 5 && oppDefectRate > 0.7) ||
      (n >= 4 && pHard > 0.75) ||
      looksRandom
    ) {
      memory.hardLock = true;
    }
    if (memory.hardLock) {
      if (memory.oppCoopStreak >= 3) memory.hardLock = false; // let them redeem
      else return [D, memory];
    }

    // 2. Exploit lock — confirmed non-retaliatory cooperator, harvest 3/round
    if (memory.exploitLock) {
      if (oppLast === D) memory.exploitLock = false; // they finally punched back
      else return [D, memory];
    }
    if (!memory.exploitLock && n >= 8 && pAllC > 0.8 && memory.oppDefStreak === 0 && memory.everWeDefected) {
      memory.exploitLock = true;
      return [D, memory];
    }

    // 3. Payoff safety net — bail if a strategy is clearly losing us value
    if (n >= 20 && avgPayoff < 0.9) {
      memory.hardLock = true;
      return [D, memory];
    }

    // 4. Deliberate probe to classify ambiguous / never-tested opponents
    const dueForProbe =
      oppLast === C && (n === 3 || (pMax < 0.55 && (n - memory.lastProbe) > 12));
    if (dueForProbe) {
      memory.lastProbe = n;
      memory.suppressRetaliation = 1; // pre-forgive their justified response
      return [D, memory];
    }

    // 5. Generous tit-for-tat: retaliate exactly once, then force a resync
    let move;
    if (oppLast === D) {
      if (memory.suppressRetaliation > 0 && pHard < 0.6) {
        memory.suppressRetaliation--;
        move = C;
      } else {
        move = D;
        memory.suppressRetaliation = pHard < 0.6 ? 1 : 0;
      }
    } else {
      move = C;
    }

    return [move, memory];
  } catch (e) {
    // Never forfeit on an exception — mirror opponent, or cooperate if no data.
    const safeMem = {
      oppC: 0, oppD: 0, recent: [], oppDefStreak: 0, oppCoopStreak: 0,
      ourScoreSum: 0, everWeDefected: false, logp: [0, 0, 0, 0, 0],
      hardLock: false, exploitLock: false, suppressRetaliation: 0, lastProbe: 0,
    };
    if (history && history.length > 0) {
      const opp = history[history.length - 1].opponent === "D" ? "D" : "C";
      return [opp, safeMem];
    }
    return ["C", safeMem];
  }
}