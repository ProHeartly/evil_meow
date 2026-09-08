// This is Sigma Bot v1

const C = "C";
const D = "D";

function payoff(a, o) {
    if (a === C && o === C) return 2;
    if (a === D && o === C) return 3;
    if (a === D && o === D) return 1;
    return 0;
}

const MODELS = [
    {
        name: "alwaysC",
        move(h) {
            return C;
        }
    },

    {
        name: "alwaysD",
        move(h) {
            return D;
        }
    },

    {
        name: "TFT",
        move(h) {
            if (h.length === 0) return C;
            return h[h.length - 1].opponent;
        }
    },

    {
        name: "grudger",
        move(h) {
            for (let i = 0; i < h.length; i++) {
                if (h[i].opponent === D) return D;
            }
            return C;
        }
    },

    {
        name: "tit2",
        move(h) {
            const n = h.length;

            if (
                n >= 2 &&
                h[n - 1].opponent === D &&
                h[n - 2].opponent === D
            ) {
                return D;
            }

            return C;
        }
    },

    {
        name: "pavlov",
        move(h) {
            if (h.length === 0) return C;

            const last = h[h.length - 1];

            const opponentPayoff = payoff(
                last.opponent,
                last.you
            );

            if (opponentPayoff === 2 || opponentPayoff === 3) {
                return last.opponent;
            }

            return last.opponent === C ? D : C;
        }
    },

    {
        name: "detective",
        move(h) {
            const n = h.length;

            if (n === 0) return C;
            if (n === 1) return D;
            if (n === 2) return C;

            if (
                h[0].opponent === C &&
                h[1].opponent === C &&
                h[2].opponent === D
            ) {
                return C;
            }

            return D;
        }
    },

    {
        name: "suspiciousTFT",
        move(h) {
            if (h.length === 0) return D;
            return h[h.length - 1].opponent;
        }
    },

    {
        name: "alternator",
        move(h) {
            return h.length % 2 === 0 ? C : D;
        }
    },

    {
        name: "generous2",
        move(h) {
            const n = h.length;

            if (
                n >= 2 &&
                h[n - 1].opponent === D &&
                h[n - 2].opponent === D
            ) {
                return D;
            }

            return C;
        }
    },

    {
        name: "antiTFT",
        move(h) {
            if (h.length === 0) return D;

            return h[h.length - 1].opponent === C ? D : C;
        }
    }
];

function fingerprint(history) {
    const n = history.length;
    const start = Math.max(0, n - 28);

    const results = new Array(MODELS.length);

    for (let m = 0; m < MODELS.length; m++) {
        const model = MODELS[m];

        let mistakes = 0;

        const opponentView = [];

        for (let i = 0; i < n; i++) {
            const predicted = model.move(opponentView);

            if (
                i >= start &&
                predicted !== history[i].opponent
            ) {
                mistakes++;
            }

            opponentView.push({
                you: history[i].opponent,
                opponent: history[i].you
            });
        }

        results[m] = {
            name: model.name,
            mistakes
        };
    }

    results.sort((a, b) => a.mistakes - b.mistakes);

    return results;
}

function knownBestMove(name, history) {
    const n = history.length;

    if (name === "alwaysC") {
        return D;
    }

    if (name === "alwaysD") {
        return D;
    }

    if (name === "detective") {
        return D;
    }

    if (name === "alternator") {
        return D;
    }

    if (name === "antiTFT") {
        return D;
    }

    if (
        name === "TFT" ||
        name === "suspiciousTFT"
    ) {
        return C;
    }

    if (name === "grudger") {
        for (let i = 0; i < n; i++) {
            if (history[i].opponent === D) {
                return D;
            }
        }

        return C;
    }

    if (
        name === "tit2" ||
        name === "generous2"
    ) {
        if (
            n > 0 &&
            history[n - 1].you === D
        ) {
            return C;
        }

        return D;
    }

    if (name === "pavlov") {
        if (
            n > 0 &&
            history[n - 1].opponent === D
        ) {
            return D;
        }

        return C;
    }

    return null;
}

function contextModel(history) {
    const MAX_CONTEXT = 3;
    const WINDOW = 80;

    const start = Math.max(
        0,
        history.length - WINDOW
    );

    const h = history.slice(start);

    const counts = Array.from(
        { length: MAX_CONTEXT + 1 },
        () => new Map()
    );

    function pairCode(you, opponent) {
        if (you === C && opponent === C) return 0;
        if (you === C && opponent === D) return 1;
        if (you === D && opponent === C) return 2;
        return 3;
    }

    for (let i = 0; i < h.length; i++) {
        const maxK = Math.min(
            MAX_CONTEXT,
            i
        );

        for (let k = 0; k <= maxK; k++) {
            let key = "";

            for (
                let j = i - k;
                j < i;
                j++
            ) {
                key += pairCode(
                    h[j].you,
                    h[j].opponent
                );
            }

            let arr = counts[k].get(key);

            if (!arr) {
                arr = [0, 0];
                counts[k].set(key, arr);
            }

            if (h[i].opponent === C) {
                arr[0]++;
            } else {
                arr[1]++;
            }
        }
    }

    function predict(recentCodes) {
        let numerator = 0;
        let denominator = 0;

        const maxK = Math.min(
            MAX_CONTEXT,
            recentCodes.length
        );

        for (
            let k = maxK;
            k >= 0;
            k--
        ) {
            let key = "";

            for (
                let j = recentCodes.length - k;
                j < recentCodes.length;
                j++
            ) {
                key += recentCodes[j];
            }

            const arr = counts[k].get(key);

            if (!arr) {
                continue;
            }

            const total = arr[0] + arr[1];

            if (total === 0) {
                continue;
            }

            const p =
                (arr[0] + 1) /
                (total + 2);

            const weight =
                Math.pow(2, k) *
                (total / (total + 5));

            numerator += p * weight;
            denominator += weight;
        }

        if (denominator === 0) {
            return 0.5;
        }

        return numerator / denominator;
    }

    return {
        pairCode,
        predict
    };
}

function fallbackMove(history) {
    const n = history.length;

    if (n === 0) {
        return C;
    }

    let recentC = 0;
    let recentD = 0;

    const begin = Math.max(
        0,
        n - 8
    );

    for (let i = begin; i < n; i++) {
        if (history[i].opponent === C) {
            recentC++;
        } else {
            recentD++;
        }
    }

    if (n >= 8 && recentC >= 7) {
        return D;
    }

    if (n >= 8 && recentD >= 7) {
        return D;
    }

    let retaliation = 0;
    let retaliationTotal = 0;

    let recovery = 0;
    let recoveryTotal = 0;

    for (let i = 1; i < n; i++) {
        if (history[i - 1].you === D) {
            retaliationTotal++;

            if (history[i].opponent === D) {
                retaliation++;
            }
        }

        if (history[i - 1].you === C) {
            recoveryTotal++;

            if (history[i].opponent === C) {
                recovery++;
            }
        }
    }

    if (retaliationTotal >= 3) {
        const r =
            retaliation / retaliationTotal;

        const recoveryRate =
            recoveryTotal > 0
                ? recovery / recoveryTotal
                : 0;

        if (
            r >= 0.72 &&
            recoveryRate > 0.62
        ) {
            return C;
        }

        if (r > 0.72) {
            return D;
        }
    }

    const model =
        contextModel(history);

    const recentCodes =
        history
            .slice(-3)
            .map(x =>
                model.pairCode(
                    x.you,
                    x.opponent
                )
            );

    const pNow =
        model.predict(recentCodes);

    function evaluateAction(action) {
        const currentExpected =
            pNow * payoff(action, C) +
            (1 - pNow) * payoff(action, D);

        let futureExpected = 0;

        const outcomes = [
            [C, pNow],
            [D, 1 - pNow]
        ];

        for (
            const [opponentMove, probability]
            of outcomes
        ) {
            const nextCodes =
                recentCodes
                    .concat([
                        model.pairCode(
                            action,
                            opponentMove
                        )
                    ])
                    .slice(-3);

            const pNext =
                model.predict(nextCodes);

            const bestNext =
                Math.max(
                    2 * pNext,
                    1 + 2 * pNext
                );

            futureExpected +=
                probability * bestNext;
        }

        return (
            currentExpected +
            0.72 * futureExpected
        );
    }

    const cooperateValue =
        evaluateAction(C);

    const defectValue =
        evaluateAction(D);

    if (
        pNow > 0.73 &&
        retaliationTotal >= 2 &&
        retaliation / retaliationTotal > 0.6
    ) {
        return C;
    }

    return defectValue >= cooperateValue
        ? D
        : C;
}

export default function bot({ history }) {
    const n = history.length;

    // Opening sequence: C, C, D, C
    if (n === 0) {
        return [C, null];
    }

    if (n === 1) {
        return [C, null];
    }

    if (n === 2) {
        return [D, null];
    }

    if (n === 3) {
        return [C, null];
    }

    const fingerprints =
        fingerprint(history);

    const best =
        fingerprints[0];

    const second =
        fingerprints[1];

    if (
        best.mistakes <= 1 &&
        (
            second.mistakes -
                best.mistakes >= 2 ||
            best.mistakes === 0
        )
    ) {
        const bestMove =
            knownBestMove(
                best.name,
                history
            );

        if (bestMove) {
            return [bestMove, null];
        }
    }

    if (n >= 5) {
        const a =
            history[n - 3];

        const b =
            history[n - 2];

        const c =
            history[n - 1];

        if (
            a.you === D &&
            a.opponent === C &&
            b.you === C &&
            b.opponent === D &&
            c.you === C &&
            c.opponent === D
        ) {
            return [D, null];
        }

        if (
            a.you === C &&
            a.opponent === D &&
            b.you === D &&
            b.opponent === D &&
            c.opponent === C
        ) {
            return [C, null];
        }
    }

    return [
        fallbackMove(history),
        null
    ];
}