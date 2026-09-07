export default function bot({ history, memory }) {
    memory = memory ?? {}

    const round = history.length + 1

    if (round === 100 || round === 101 || round === 102)
        return ["D", memory]

    if (round >= 103) {
        const opponentRound101 = history.at(100)?.opponent
        const opponentRound102 = history.at(101)?.opponent

        if (opponentRound101 === "C" && opponentRound102 === "C")
            return ["D", memory]
    }

    if (history.length === 0)
        return ["C", memory]

    const lastOpponentMove = history.at(-1)?.opponent

    return [lastOpponentMove, memory]
}