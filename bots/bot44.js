export default function bot({ history, memory }) {
  memory = memory ?? {
    betrayed: false
  };

  // First round: cooperate
  if (history.length === 0) {
    return ["C", memory];
  }

  const last = history.at(-1).opponent;

  // One defection = permanent retaliation
  if (last === "D") {
    memory.betrayed = true;
  }

  if (memory.betrayed) {
    return ["D", memory];
  }

  return ["C", memory];
}