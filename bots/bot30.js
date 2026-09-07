export default function bot({ history, memory }) {
    const round = history.length;
    if (round === 0) return ["C", initMemory()];
    const m = memory ?? initMemory();
    const last = history.at(-1);
    m.everCooperated = m.everCooperated || last.opponent === "C";
    const move = last.opponent === "D"
        ? (Math.random() < 0.12 ? "C" : "D")
        : "C";
    return [move, m];
}

function initMemory() {
    return { everCooperated: false };
}