export default function bot({ history, memory }) {
  memory = memory ?? {
    d: 0,
    c: 0,
    streak: 0,
    mode: "calm"
  }

  // SPECIAL MOVE: Opening Probe 🥷
  if (history.length === 0) {
    return ["C", memory]
  }

  const last = history.at(-1).opponent

  if (last === "D") {
    memory.d++
    memory.streak++
  } else {
    memory.c++
    memory.streak = 0
  }

  // 🥷 COUNTERSTRIKE MODE
  // If they defect repeatedly, stop trusting them.
  if (memory.streak >= 2) {
    memory.mode = "counter"
    return ["D", memory]
  }

  // Reward cooperation
  // If they're playing fair, cooperate back.
  if (last === "C") {
    memory.mode = "calm"
    return ["C", memory]
  }

  // Punish a single betrayal
  return ["D", memory]
}