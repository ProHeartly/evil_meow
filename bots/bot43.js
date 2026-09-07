export default function bot({ history, memory }) {
  memory = memory ?? {
    probeRound: null, // round index where we last threw an exploit probe
  }

  const round = history.length

  // --- First move: always cooperate to open the door for trust ---
  if (round === 0) return ["C", memory]

  const lastOpp = history.at(-1).opponent

  // --- Early game: plain generous tit-for-tat while we gather data.
  //     Widened from 10 -> 25 rounds: a "reactive" read off <10 points was
  //     noise, not signal, and locked us out of exploiting a real pushover. ---
  if (round < 25) {
    const forgive = lastOpp === "D" && Math.random() < 0.15
    return [lastOpp === "D" && !forgive ? "D" : "C", memory]
  }

  // --- Stats over full history ---
  const oppDefects = history.filter(m => m.opponent === "D").length
  const oppDefectRate = oppDefects / round

  // Grudger signature: after our first defection, does opponent basically
  // never cooperate again?
  const firstOurDefectIdx = history.findIndex(m => m.you === "D")
  let grudgerLike = false
  if (firstOurDefectIdx !== -1 && firstOurDefectIdx < round - 5) {
    const after = history.slice(firstOurDefectIdx + 1)
    const defectsAfter = after.filter(m => m.opponent === "D").length
    grudgerLike = defectsAfter / after.length > 0.9
  }

  // Reactive signature: correlate opponent's move with OUR previous move,
  // using only the LAST 30 rounds (sliding window) so a stale or lucky
  // early read can't lock us in forever, and require a real sample size.
  const windowStart = Math.max(1, history.length - 30)
  let matches = 0
  let checked = 0
  for (let i = windowStart; i < history.length; i++) {
    const ourPrev = history[i - 1].you
    const oppNow = history[i].opponent
    checked++
    if (ourPrev === oppNow) matches++
  }
  const reactivity = checked >= 15 ? matches / checked : 0.5 // not enough data => don't trust it

  // --- Classification & response ---
// 1) Near-total cooperator: exploit, but not 100% of the time
  if (oppDefectRate < 0.05) {
    return [round % 5 === 0 ? "C" : "D", memory]
  }

  // 2) Near-total defector: minimize damage, don't get exploited
  if (oppDefectRate > 0.6) {
    return ["D", memory]
  }

  // 3) Grudger-like: never poke the bear
  if (grudgerLike) {
    return ["C", memory]
  }

  // 4) Reactive/tit-for-tat-like with a decent-sized sample: cooperate,
  //    forgive occasional defections, but periodically probe (every ~40
  //    rounds) with a single defection to check whether the "reactive" read
  //    is still accurate and whether exploitation has become safe (e.g. a
  //    bot that's actually soft and stopped punishing). If the probe gets
  //    punished, we're back to normal next round via lastOpp handling above.
  if (checked >= 15 && reactivity > 0.7) {
    const dueForProbe =
      memory.probeRound === null || round - memory.probeRound >= 40
    if (dueForProbe && lastOpp !== "D") {
      memory.probeRound = round
      return ["D", memory]
    }
    const forgive = lastOpp === "D" && Math.random() < 0.2
    return [lastOpp === "D" && !forgive ? "D" : "C", memory]
  }

  // 5) Roughly random / unclear pattern: defect has higher expected value
  if (checked >= 15 && reactivity < 0.3) {
    return ["D", memory]
 // 6) Default fallback: generous tit-for-tat
  }
 const forgive = lastOpp === "D" && Math.random() < 0.15
  return [lastOpp === "D" && !forgive ? "D" : "C", memory]
}