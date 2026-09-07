export default function bot({ history, memory }) {
  memory = memory ?? {
    defections: 0,
    punishForever: false
  };

  if (history.length === 0) {
    return ["C", memory];
  }

  const last = history.at(-1).opponent;

  if (last === "D") {
    memory.defections++;
  }

  if (memory.defections >= 2) {
    memory.punishForever = true;
  }

  if (memory.punishForever) {
    return ["D", memory];
  }

  // Before the second betrayal: simple tit-for-tat
  return [last, memory];
}