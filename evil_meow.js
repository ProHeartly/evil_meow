// trained table
const TRAINED_TABLE = {
    // will be filled after its trained..
};

export default function bot({ history, memory }) {
    const n = history.length;

    if (memory === null) {
        memory = { oppDCount: 0 };
    }

    if (n > 0 && history[n - 1].opponent === 'D') {
        memory.oppDCount++;
    }

    let state = 'START';

    if (n===1) {
        state = `${history[0].you}${history[0].opponent}`;
    } else if (n>=2) {
        const r1 = history[n - 2];
        const r2 = history[n - 1];

        const p = memory.oppDCount === 0 ? 'P' : 'T';
        const rate = memory.oppDCount / n;
        const f = rate <= 0.20 ? 'L' : (rate <= 0.50 ? 'M' : 'H');

        state = `${r1.you}${r1.opponent}_${r2.you}${r2.opponent}_${p}_${f}`;
    }

    const move = TRAINED_TABLE[state] || "D"; // play "D" just in case

    return [move, memory]
}