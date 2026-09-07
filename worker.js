import { parentPort, workerData } from 'worker_threads';
import path from 'path';
import { pathToFileURL } from 'url';

const PAYOFFS = { 'C': { 'C': 2, 'D': 0 }, 'D': { 'C': 3, 'D': 1 } };
const { stateKeys, botsDir, files } = workerData;

const STATE_MAP = new Map(stateKeys.map((key, index) => [key, index]));

let opponents = [];

async function initWorkers() {
    for (const file of files) {
        const filePath = pathToFileURL(path.join(botsDir, file)).href;
        const module = await import(filePath);
        opponents.push({ name: file, fn: module.default });
    }
}

function runMatchSync(genome, oppBot, totalRounds) {
    let historyA = [], historyB = [];
    let memoryB = null;
    let score = 0;
    let oppDCount = 0;

    for (let r = 0; r < totalRounds; r++) {
        let stateKey = 'START';
        if (r === 1) {
            stateKey = `${historyA[0].you}${historyA[0].opponent}`;
        } else if (r >= 2) {
            const r1 = historyA[r - 2];
            const r2 = historyA[r - 1];
            const p = oppDCount === 0 ? 'P' : 'T';
            const rate = oppDCount / r;
            const f = rate <= 0.20 ? 'L' : (rate <= 0.50 ? 'M' : 'H');
            stateKey = `${r1.you}${r1.opponent}_${r2.you}${r2.opponent}_${p}_${f}`;
        }

        const idx = STATE_MAP.get(stateKey);
        const moveA = (idx !== undefined) ? genome[idx] : 'C';

        let moveB = 'D';
        try {
            const res = oppBot.fn({ history: historyB, memory: memoryB });
            if (Array.isArray(res)) {
                moveB = res[0] || 'D';
                memoryB = res[1];
            } else {
                moveB = res || 'D';
            }
        } catch (e) {}

        if (moveB === 'D') oppDCount++;

        historyA.push({ you: moveA, opponent: moveB });
        historyB.push({ you: moveB, opponent: moveA });
        score += PAYOFFS[moveA][moveB];
    }
    return score / totalRounds;
}

initWorkers().then(() => {
    parentPort.on('message', (data) => {
        const genomes = Array.isArray(data) ? data : (data.genomes || []);
        const results = genomes.map(genome => {
            let totalScore = 0;
            for (let opp of opponents) {
                totalScore += runMatchSync(genome, opp, 100);
                totalScore += runMatchSync(genome, opp, 125);
                totalScore += runMatchSync(genome, opp, 150);
            }
            return { genome, fitness: totalScore / (opponents.length * 3) };
        });
        parentPort.postMessage(results);
    });
});