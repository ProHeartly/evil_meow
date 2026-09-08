export default function bot({ history, memory }) {
    if (history.length < 3) {
        return [Math.random() < 0.5 ? "C" : "D", memory];
    }

    const recent = history.slice(-6);

    let cor = 0;
    let def = 0;

    for (const round of recent) {
        if (round.opponent === "D") {
            ++def;
        } else{
            ++cor;
        }
    }
    let totalDef = 0;
    for (const round of history) {
        if (round.opponent === "D"){
            ++totalDef;
        }
    }
    const totalRounds = history.length;
    const defRate = totalDef / totalRounds
    if (defRate > 0.6 && def >= 2) {
        return ["D", memory];
    }

    if (defRate < 0.4 && cor >= 4) {
        if (Math.random() < 0.3) {
            return ["D", memory];
        }
        return ["C", memory];
    }

    let afterC = { C: 0, D: 0 };
    let afterD = { C: 0, D: 0 };

    for (let i = 1; i < history.length; ++i) {
        const prev = history[i - 1];
        const current = history[i];

        if (prev.me === "C") {
            ++afterC[current.opponent];
        }
        else {
            ++afterD[current.opponent];
        }
    }
    
    if (afterC.D > afterC.C && afterD.C > afterD.D) {
        return [Math.random() < 0.5 ? "C" : "D", memory];
    }

    return [history.at(-1).opponent, memory];
}