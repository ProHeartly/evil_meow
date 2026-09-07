import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath, pathToFileURL } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAYOFFS = {
    'C': { 'C': 2, 'D': 0 },
    'D': { 'C': 3, 'D': 1 }
};

const BASE_ROUNDS = 100;
const CONTINUATION_PROBABILITY = 0.95;

let stopRequested = false;

if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
            console.log('\n\n[!] Shutdown requested.');
            stopRequested = true;
        }
    });
}

function getMatchLength() {
    let rounds = BASE_ROUNDS;
    while (Math.random() < CONTINUATION_PROBABILITY) {
        rounds++;
    }
    return rounds;
}

async function runMatch(botA, botB) {
    let historyA = [];
    let historyB = [];
    let memoryA = null;
    let memoryB = null;

    let scoreA = 0;
    let scoreB = 0;

    const totalRounds = getMatchLength();

    for (let r = 0; r < totalRounds; r++) {
        const [moveA, nextMemA] = await botA.fn({ history: historyA, memory: memoryA });
        const [moveB, nextMemB] = await botB.fn({ history: historyB, memory: memoryB });

        memoryA = nextMemA;
        memoryB = nextMemB;

        historyA.push({ you: moveA, opponent: moveB });
        historyB.push({ you: moveB, opponent: moveA });

        scoreA += PAYOFFS[moveA][moveB];
        scoreB += PAYOFFS[moveB][moveA];
    }
    return { scoreA, scoreB, totalRounds };
}

const TOURNAMENT_ITERATIONS = 1000;

async function runTournament() {
    const botsDir = path.join(__dirname, 'bots');

    const files = fs.readdirSync(botsDir).filter(f => f.endsWith('.js'));
    const bots = [];

    for (const file of files) {
        const filePath = pathToFileURL(path.join(botsDir, file)).href;
        const module = await import(filePath);

        bots.push({
            name: file,
            fn: module.default,
            totalScore: 0,
            totalRoundsPlayed: 0,
            matchesPlayed: 0
        });
    }

    let matchCount = 0

    outerLoop:
    for (let iter = 0; iter < TOURNAMENT_ITERATIONS; iter++) {
        for (let i = 0; i < bots.length; i++) {
            for (let j = i + 1; j < bots.length; j++) {
                if (stopRequested) break outerLoop;

                const botA = bots[i];
                const botB = bots[j];

                const { scoreA, scoreB, totalRounds } = await runMatch(botA, botB);

                botA.totalScore += scoreA;
                botA.totalRoundsPlayed += totalRounds;
                botA.matchesPlayed++;

                botB.totalScore += scoreB;
                botB.totalRoundsPlayed += totalRounds;
                botB.matchesPlayed++;
            }
        }
    }

    const leaderboard = bots.map( b=> {
        const avgScore = b.totalRoundsPlayed > 0 ? (b.totalScore / b.totalRoundsPlayed).toFixed(3) : 0;
        return {
            Bot: b.name,
            "Avg Score": parseFloat(avgScore),
            "Total Points": b.totalScore,
            "Total Rounds": b.totalRoundsPlayed,
            Mathces: b.matchesPlayed
        };
    });

    leaderboard.sort((a, b) => b['Avg Score'] - a['Avg Score']);
    console.table(leaderboard);
    cleanupAndExit();
}

function cleanupAndExit(code = 0) {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
    }
    process.exit(code);
}

runTournament().catch(err => {
    console.error(err);
    cleanupAndExit(1);
});