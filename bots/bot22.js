// Let's first make tit for tat thingy then modify it ig :D

export default function bot( {history} ) {
    const n = history.length

    // yah let's start with cooperate
    if (n === 0) return ["C", null]
    const move = history.at(-1).opponent
    return [move, null]
}