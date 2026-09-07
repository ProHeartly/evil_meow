export default function bot({ history, memory }) {
  memory = memory ?? {
    opponentDefects: 0,
    opponentCooperates: 0,
    lastOpponentMove: null,
    retaliation: 0
  }

  const rounds = history.length

  // "No be first to attack."
  // Start peacefully and observe.
  if (rounds === 0) {
    return ["C", memory]
  }

  const opponent = history.at(-1).opponent

  // Learn from every move
  if (opponent === "D") {
    memory.opponentDefects++
  } else {
    memory.opponentCooperates++
  }

  memory.lastOpponentMove = opponent

  // "If attack comes, defend yourself."
  // Immediately retaliate against a defection.
  if (opponent === "D") {
    memory.retaliation++
    return ["D", memory]
  }

  // If opponent is consistently aggressive,
  // stay defensive instead of trusting too easily.
  const total = memory.opponentDefects + memory.opponentCooperates
  const aggression =
    total > 0 ? memory.opponentDefects / total : 0

  if (
    memory.opponentDefects >= 3 &&
    aggression >= 0.40
  ) {
    return ["D", memory]
  }

  // "The best fight is the one you don't have to fight."
  // Reward cooperation with cooperation.
  return ["C", memory]
}