const FIRST_PROBE_AFTER = 4;
const REPROBE_STREAK = 16;
const HOSTILE_WINDOW = 4;

function freshMemory() {
  return {
    mode: "observe",
    probeAt: null,
    lastProbeAt: -100,
    reactive: false,
    mercy: 1
  };
}

function cStreak(history) {
  let streak = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].opponent !== "C") break;
    streak++;
  }

  return streak;
}

function recentDefections(history, size) {
  const recent = history.slice(-size);
  return recent.filter(r => r.opponent === "D").length;
}

function responseAfterOurD(history, window = 24) {
  let samples = 0;
  let cooperations = 0;

  const start = Math.max(1, history.length - window);

  for (let i = start; i < history.length; i++) {
    if (history[i - 1].you === "D") {
      samples++;

      if (history[i].opponent === "C") {
        cooperations++;
      }
    }
  }

  return {
    samples,
    rate: samples === 0 ? 0 : cooperations / samples
  };
}

function cooperationRate(history, window = 16) {
  const recent = history.slice(-window);

  if (recent.length === 0) return 1;

  let cooperations = 0;

  for (const round of recent) {
    if (round.opponent === "C") {
      cooperations++;
    }
  }

  return cooperations / recent.length;
}

function decide(history, memory) {
  const n = history.length;

  if (n === 0) {
    return ["C", memory];
  }

  const last = history[n - 1];
  const previous = n >= 2 ? history[n - 2] : null;

  const streak = cStreak(history);
  const cRate = cooperationRate(history);
  const response = responseAfterOurD(history);

  if (
    n >= HOSTILE_WINDOW &&
    recentDefections(history, HOSTILE_WINDOW) >= 3
  ) {
    memory.mode = "defend";
    memory.probeAt = null;
    return ["D", memory];
  }

  if (memory.mode === "defend") {
    if (streak >= 5) {
      memory.mode = "partner";
    } else {
      return ["D", memory];
    }
  }

  if (memory.probeAt !== null) {
    if (n === memory.probeAt + 1) {
      return ["C", memory];
    }

    if (n >= memory.probeAt + 2) {
      const reaction = history[memory.probeAt + 1]?.opponent;

      memory.probeAt = null;

      if (reaction === "C") {
        memory.mode = "exploit";
        memory.reactive = false;
        return ["D", memory];
      }

      memory.mode = "partner";
      memory.reactive = true;
      return ["C", memory];
    }
  }

  if (memory.mode === "exploit") {
    if (last.opponent === "D") {
      memory.mode = "partner";
      memory.reactive = true;
      return ["C", memory];
    }

    return ["D", memory];
  }

  if (
    response.samples >= 3 &&
    response.rate >= 0.67 &&
    cRate >= 0.65
  ) {
    memory.mode = "exploit";
    memory.reactive = false;
    return ["D", memory];
  }

  if (
    memory.mode === "observe" &&
    n >= FIRST_PROBE_AFTER &&
    streak >= FIRST_PROBE_AFTER
  ) {
    memory.probeAt = n;
    memory.lastProbeAt = n;
    return ["D", memory];
  }

  if (
    memory.mode === "partner" &&
    streak >= REPROBE_STREAK &&
    n - memory.lastProbeAt >= REPROBE_STREAK
  ) {
    memory.probeAt = n;
    memory.lastProbeAt = n;
    return ["D", memory];
  }

  if (
    memory.mode === "observe" &&
    n >= 8 &&
    cRate >= 0.9 &&
    n - memory.lastProbeAt >= 6
  ) {
    memory.probeAt = n;
    memory.lastProbeAt = n;
    return ["D", memory];
  }

  if (last.opponent === "D") {
    const provoked =
      previous !== null &&
      previous.you === "D";

    if (provoked) {
      memory.mode = "partner";
      return ["C", memory];
    }

    if (
      memory.mercy > 0 &&
      previous !== null &&
      cooperationRate(history.slice(0, -1), 8) >= 0.85
    ) {
      memory.mercy--;
      return ["C", memory];
    }

    return ["D", memory];
  }

  if (
    memory.mode === "partner" ||
    memory.mode === "observe"
  ) {
    return ["C", memory];
  }

  return ["D", memory];
}

export default function bot(state) {
  let memory =
    state &&
    state.memory &&
    typeof state.memory === "object"
      ? state.memory
      : freshMemory();

  try {
    const history =
      state && Array.isArray(state.history)
        ? state.history
        : [];

    if (
      typeof memory.mode !== "string" ||
      !("probeAt" in memory)
    ) {
      memory = freshMemory();
    }

    const [move, nextMemory] = decide(history, memory);

    return [
      move === "C" ? "C" : "D",
      nextMemory
    ];
  } catch {
    return ["D", memory || freshMemory()];
  }
}