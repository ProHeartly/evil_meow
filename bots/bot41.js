export default function bot({ history, memory }) {
    const currentRound = history.length
    const handshake = ["C", "C", "D", "C"]

    if (memory == null) {
        memory = {
            status: "handshake"
        }
    }

    if (memory.status === "handshake") {
        if (currentRound > 0) {
            const lastOppMove = history.at(-1).opponent
            const expMove = handshake[currentRound - 1]

            if (lastOppMove !== expMove) {
                memory.status = "enemy"
            }
            else if (currentRound === handshake.length) {
                memory.status = "ally"
            }
        }

        if (memory.status === "handshake") {
            const move = handshake[currentRound]
            return [move, memory]
        }
    }

    if (memory.status === "ally") {
        return ["C", memory]
    }

    if (memory.status === "enemy") {
        const lastOppMove = history.at(-1).opponent

        if (lastOppMove === "C") {
            return ["C", memory]
        }
        else {
            const forgive = Math.random() < 0.1
            const move = forgive ? "C" : "D"
            return [move, memory]
        }
    }
}