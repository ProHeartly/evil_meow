export default function bot({ history, memory }) {
    if (!memory) {
        memory = {
            testSequence: ["C", "D", "C"],
            opponentType: null,
        };
    }

    const currentRound = history.length;

    if (currentRound < 3) {
        const move = memory.testSequence[currentRound];
        return [move, memory];
    }

    if (!memory.opponentType) {
        const opp0 = history[0].opponent;
        const opp1 = history[1].opponent;
        const opp2 = history[2].opponent;

        if (opp0 === "C" && opp1 === "C" && opp2 === "C") {
            memory.opponentType = "BISOUNOURS";
        } else if (opp0 === "D" && opp1 === "D" && opp2 === "D") {
            memory.opponentType = "MECHANT";
        } else {
            memory.opponentType = "REACTIF";
        }
    }

    let nextMove = "C";

    switch (memory.opponentType) {
        case "BISOUNOURS":
            nextMove = "D";
            break;

        case "MECHANT":
            nextMove = "D";
            break;

        case "REACTIF":
            const lastOpponentMove = history.at(-1).opponent;
            nextMove = lastOpponentMove;
            break;
    }

    return [nextMove, memory];
}