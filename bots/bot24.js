export default function bot({ history }) {

    if (history.length < 2) {
        return ["C", null];
    }

    const lastOppMove = history.at(-1).opponent;
    const prevOppMove = history.at(-2).opponent;

    if (lastOppMove === "D" && prevOppMove === "D") {
        return ["D", null];
    }

    return ["C", null];
}