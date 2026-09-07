export default function bot({ history, memory}) {
    memory = memory ?? { OpponentDefected: false, counter: 0 }
    let move = "C"
    
    const lastOpponentMove = history.at(-1)?.opponent

    if (lastOpponentMove === "D") {
        memory.OpponentDefected = true
    }

    if (lastOpponentMove === "C") {
        memory.OpponentDefected = false
    }

    if (memory.OpponentDefected === true && memory.counter < 1) {
        move = "C"
        memory.counter = 1
    } else if (memory.OpponentDefected === true && memory.counter >= 1) {
        move = "D"
    } else if (memory.OpponentDefected === false && memory.counter < 1) {
        move = "C"
    } else if (memory.OpponentDefected === false && memory.counter >= 1) {
        move = "D"
        memory.counter = 0
    }

    return [move, memory] //lets hope its correct this time atleast :sob:

}