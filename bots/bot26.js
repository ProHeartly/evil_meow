export default function bot({ history, memory }) {
    if (!memory) {
        memory = {};
    }
    if (history.length === 0) {
        return ['C', memory];
    }
    let opponentOnlyCooperate = true;
    let opponentOnlyDeflect = true;
    let opponentCooperations = 0;
    let opponentDeflections = 0;
    history.forEach(match => {
        if (match.opponent == 'D') {
            opponentOnlyCooperate = false;
            opponentDeflections += 1;
        }
        if (match.opponent == 'C') {
            opponentOnlyDeflect = false;
            opponentCooperations += 1;
        }
    });
    if (history.length < 10) {
        opponentOnlyCooperate = false;
        opponentOnlyDeflect = false;
    }
    let coopChance = opponentCooperations / history.length;
    let deflChance = opponentDeflections / history.length;
    if (opponentOnlyCooperate || opponentOnlyDeflect) {
        return ['D', memory];
    }
    if (history.length > 10) {
        return [Math.random() > coopChance ? 'C' : 'D', memory];
    }
    return ['C', memory];
}
//# sourceMappingURL=bot1.js.map