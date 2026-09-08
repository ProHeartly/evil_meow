export default function bot({memory, history}){
    try {    memory ??= {
            rounds: 0,
            cooperations: 0,
            defections: 0,
            model: {
                C: {C: 1, D: 1},
                D: {C: 1, D: 1}
            },
            markov2: {},
            patBuf: [],
            consecutiveD: 0
        };

        let move = "C";

        // Keep a count of the moves and update the memory counter

        const lastMove = history.at(-1)?.opponent;

        if (lastMove === "C"){
            memory.cooperations++;
        } else if (lastMove === "D"){
            memory.defections++;
        }
        if (lastMove){ 
            memory.patBuf.push(lastMove);
            if (memory.patBuf.length > 20) memory.patBuf.shift();
        }

        memory.rounds = memory.cooperations + memory.defections;


        // Calculate defect rate in diffferent windows 

        function defectRate(history, n){
            const recent = history.slice(-n);
            if (recent.length === 0) return 0

            return recent.filter(x => x.opponent === "D").length / recent.length;
        }

        const d5 = defectRate(history, 5);
        const d10 = defectRate(history, 10);
        const d30 = defectRate(history, 30)

        const alwaysD = memory.defections >= 5 && memory.cooperations === 0;

        const previous = history.at(-1);
        if (previous){
            memory.model[previous.you][previous.opponent]++;
        }

        const longCooperation = memory.cooperations >= 10 && memory.defections === 0;

        const unprovokedDefection = previous && previous.you === "C" && previous.opponent === "D";

        const mutualDefection = previous && previous.you === "D" && previous.opponent === "D";

        // Probability

        function probDefect(model, ourMove){
            const data = model[ourMove];

            return data.D / (data.C + data.D)
        }

        const pDifC = probDefect(memory.model, "C");
        const pDifD = probDefect(memory.model, "D")

        const cSamples = memory.model.C.C + memory.model.C.D - 2;
        const dSamples = memory.model.D.C + memory.model.D.D - 2;

        const expectedD = (1 - pDifD) * 3 + pDifD * 1;
        const expectedC = (1 - pDifC) * 2 + pDifC * 0;

        if (previous && history.at(-2)){
            const key = `${history.at(-2).you}${history.at(-2).opponent}`;
            memory.markov2[key] ??= { C: 2, D: 2};  
            memory.markov2[key][previous.opponent]++;
        }

        const m2key = previous ? `${previous.you}${previous.opponent}` : null;
        const m2data = m2key ? memory.markov2[m2key] : null;
        const mpred = m2data && (m2data.C + m2data.D) > 6
            ? m2data.D / (m2data.C + m2data.D)
            : null;

        const prediction = mpred !== null   
            ? 0.4 * mpred + 0.35 * d5 + 0.25 * d10
            : 0.5 * d5 + 0.3 * d10 + 0.2 * d30;

        function detectPeriod() {
            const buf = memory.patBuf;
            for (let p = 2; p <= 5; p++){
                if (buf.length < p * 2) continue;
                if (buf.slice(-p).join("") === buf.slice(-p*2, -p).join("")){
                    return buf.slice(-p);
                }
            }
            return null
        }

        const period = detectPeriod();
        if (period){
            move = period[history.length % period.length] === "D" ? "D" : "C"
            return [move, memory];
        }
        if (previous?.opponent === "D" && previous.you === "D") memory.consecutiveD = (memory.consecutiveD ?? 0) + 1;
        else memory.consecutiveD = 0;


        // Detect  pattern tit for tat

        function detectTFT(history){
            if (history.length < 6) return false;
            const sample = history.slice(-6);
            return sample.slice(1).every((r, i) => r.opponent === sample[i].you);
        }

        function detectGTFT(history){
            if (history.length < 10) return false;
            const sample = history.slice(-10);
            const copies = sample.slice(1).filter((r, i) => r.opponent === sample[i].you).length;
            return copies >= 8;
        }

        const isTFT = detectTFT(history);
        const isGTFT = detectGTFT(history);

        if (isGTFT && !isTFT){
            move = history.length % 4 === 3 ? "D" : "C";
            return [move, memory];
        }

        if (isTFT){
            move = "C";
            return [move, memory]
        }

        // Logic of answer

        if (cSamples < 2 && dSamples < 2){
            move = "C";
        } else if (alwaysD){
            move = "D";
        } else if(memory.consecutiveD >= 3 && memory.cooperations > 0){
            move = "C"
        } else if (unprovokedDefection && pDifC > 0.65 && cSamples >= 3){
            move = "D";
        } else if (prediction > 0.65 && history.length >= 5 && !mutualDefection){
            move = "D";
        } else if (expectedD > expectedC && dSamples >= 3 && !mutualDefection){
            move = "D";
        } else {
            move = "C";
        }

        return[move, memory]
    } catch(e) {
        return ["C", memory ?? null];
    }
}