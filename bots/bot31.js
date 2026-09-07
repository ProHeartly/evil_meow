//     Reactant V3.2 bot by Elio A.

export default function bot({ history, memory }) {

    if (history.length === 0) return ["C", { Dstreak: 0 , Cstreak: 0, olives : 3, betrayLock: false}] // default starting move

    memory = memory ?? { Dstreak: 0, Cstreak: 0, olives : 3, betrayLock: false } // basic null check

    const lastOpponentMove = history.at(-1).opponent

    if (lastOpponentMove === "D") {
        memory.Dstreak += 1
    } else {
        memory.Dstreak = 0
    }
    if (lastOpponentMove === "C") {
        memory.Cstreak += 1
    } else {
        memory.Cstreak = 0
    }
    if (memory.betrayLock) {
        return ["D", memory]
    }
    // Every 10 rounds while locked in conflict, offer an olive branch up to 3 times
    const round = history.length
    if (memory.Dstreak >= 2 && round % 10 === 0 && memory.olives > 0) {
        memory.olives = memory.olives - 1
        return ["C", memory]
    }
    if (memory.Cstreak >= 5 && Math.random * 10 > 9) {
        memory.olives = memory.olives - 1
        memory.betrayLock = true
        return ["D", memory]
    }
    const move = memory.Dstreak >= 2 ? "D" : "C"
    return [move, memory]
}