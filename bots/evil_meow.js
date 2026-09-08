// trained table
const TRAINED_TABLE = {}

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

        const p_opp = memory.oppDCount === 0 ? 'P' : 'T';
        const rate_opp = memory.oppDCount / n;
        const f_opp = rate_opp <= 0.20 ? 'L' : (rate_opp <= 0.50 ? 'M' : 'H');

        const p_me = memory.myDCount === 0 ? 'P' : 'T';
        const rate_me = memory.myDCount / n;
        const f_me = rate_me <= 0.20 ? 'L' : (rate_me <= 0.50 ? 'M' : 'H');

        stateKey = `${r1.you}${r1.opponent}_${r2.you}${r2.opponent}_${p_opp}_${f_opp}_${p_me}_${f_me}`;
    }

    const move = TRAINED_TABLE[state] || "D"; // play "D" just in case

    return [move, memory]
}