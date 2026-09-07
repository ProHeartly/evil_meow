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

const POPULATION_SIZE = 200;
const GENERATIONS = 6000;
const MUTATION_RATE = 0.03;

function getStateKeys() {
    let keys = ['START'];
    const moves = ['C', 'D'];

    moves.forEach( m1 => moves.forEach( o1 => keys.push(`${m1}${o1}`)));

    const pure = ['P', 'T']
    const freq = ['L', 'M', 'H'];

    moves.forEach( m1 => moves.forEach( o1 => 
        moves.forEach(m2 => moves.forEach( o2 => 
            pure.forEach(p => freq.forEach( f=> 
                keys.push(`${m1}${o1}_${m2}${o2}_${p}_${f}`)
            ))
        ))
    ));
    return keys;
}

const STATE_KEYS = getStateKeys();
const GENOME_LENGTH = STATE_KEYS.length;

function randomGenome() {
    return Array.from({ length: GENOME_LENGTH }, () => Math.random() < 0.5 ? 'C': 'D').join('');
}

function genomeToPolicy(genome) {
    let policy = {};
    STATE_KEYS.forEach((key, index) => policy[key] = genome[index]);
    return policy;
}

async function runMatch(genome, oppBot) {
    const policy = genomeToPolicy(genome);
    let historyA = [];
    let historyB = [];
    let memoryB = null;
    let score = 0;

    const totalRounds = 100 + Math.floor(Math.random() * 50);

    let oppDCount = 0;

    for (let r = 0; r < totalRounds; r++) {
        let state = 'START';

        if (r===1) {
            state = `${historyA[0].you}${historyA[0].opponent}`;
        } else if (r >= 2) {
            const r1 = historyA[r - 2];
            const r2 = historyA[r - 1];
            const p = oppDCount === 0 ? 'P' : 'T';
            const rate = oppDCount/r;
            const f = rate <= 0.20 ? 'L' : (rate <= 0.50 ? 'M' : 'H');

            state = `${r1.you}${r1.opponent}_${r2.you}${r2.opponent}_${p}_${f}`;
        }

        const moveA = policy[state] || 'D';
        let moveB = 'D';

        try {
            [moveB, memoryB] = await oppBot.fn({ history: historyB, memory: memoryB });
        } catch (e) {}

        if (moveB === 'D') oppDCount++;

        historyA.push({ you: moveA, opponent: moveB });
        historyB.push({ you: moveB, opponent: moveA });

        score += PAYOFFS[moveA][moveB];
    }
    return score / totalRounds;
}


async function train() {
    const botsDir = path.join(__dirname, 'bots');
    const files = fs.readdirSync(botsDir).filter(f => f.endsWith('.js') && !f.includes('evil_meow'));
    
    const opponents = [];

    for (const file of files) {
        const filePath = pathToFileURL(path.join(botsDir, file)).href;
        const module = await import(filePath);

        opponents.push({
            name: file,
            fn: module.default
        });
    }

    console.log(`\n Evolving over ${GENERATIONS} generations...`)

    let population = Array.from({ length: POPULATION_SIZE }, randomGenome);
    let bestGlobalGenome = population[0];
    let bestGlobalFitness = 0;

    for (let i = 0; i < GENERATIONS; i++) {
        let fitnessScores = [];
        for (let genome of population) {
            let totalScore = 0;
            for (let opp of opponents) {
                totalScore += await runMatch(genome, opp);
            }
            fitnessScores.push({ genome, fitness: totalScore / opponents.length})
        }

        fitnessScores.sort((a, b) => b.fitness - a.fitness);

        if (fitnessScores[0].fitness > bestGlobalFitness) {
            bestGlobalFitness = fitnessScores[0].fitness;
            bestGlobalGenome = fitnessScores[0].genome;
        }

        if (i % 50 === 0 || i === 1) {
            console.log(`[GEN ${i}] Best Fitness: ${fitnessScores[0].fitness.toFixed(3)}`);
        }

        let nextGen = [];
        const elites = fitnessScores.slice(0, Math.floor(POPULATION_SIZE * 0.1)).map(f => f.genome);
        nextGen.push(...elites);

        while (nextGen.length < POPULATION_SIZE) {
            const parent1 = tournamentSelect(fitnessScores);
            const parent2 = tournamentSelect(fitnessScores);
            
            const crossPoint = Math.floor(Math.random() * GENOME_LENGTH);
            let child = parent1.substring(0, crossPoint) + parent2.substring(crossPoint);

            let mutatedChild = '';
            for (let a = 0; a < child.length; a++) {
                mutatedChild += (Math.random() < MUTATION_RATE) ? (child[a] === 'C' ? 'D' : 'C') : child[a];
            }
            nextGen.push(mutatedChild);
        }
        population = nextGen;
    }

    fs.writeFileSync(path.join(__dirname, 'evil_meow_map.json'), JSON.stringify(genomeToPolicy(bestGlobalGenome), null, 2));
    console.log(`\n Evolution Complete!! BEST OVERALL AVERAGE: ${bestGlobalFitness.toFixed(3)}`);
}

function tournamentSelect(fitnessScores) {
    const k = 3;
    let best = null;
    for (let i = 0; i < k; i++) {
        const candidate = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
        if (!best || candidate.fitness > best.fitness) best = candidate;
    }

    return best.genome
}

train().catch(console.error);