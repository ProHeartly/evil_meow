import fs from 'fs';
import path from 'path';
import os from 'os';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POPULATION_SIZE = 200;
const GENERATIONS = 6000;
const MUTATION_RATE = 0.03;

const PATIENCE = 500;
const MIN_DELTA = 0.001;

function getStateKeys() {
    let keys = ['START'];
    const moves = ['C', 'D'];
    moves.forEach(m1 => moves.forEach(o1 => keys.push(`${m1}${o1}`)));
    const pure = ['P', 'T'];
    const freq = ['L', 'M', 'H'];

    moves.forEach(m1 => moves.forEach(o1 => 
        moves.forEach(m2 => moves.forEach(o2 => 
            pure.forEach(p => freq.forEach(f => 
                keys.push(`${m1}${o1}_${m2}${o2}_${p}_${f}`)
            ))
        ))
    ));
    return keys;
}

const STATE_KEYS = getStateKeys();
const GENOME_LENGTH = STATE_KEYS.length;

function randomGenome() {
    return Array.from({ length: GENOME_LENGTH }, () => Math.random() < 0.5 ? 'C' : 'D').join('');
}

function genomeToPolicy(genome) {
    let policy = {};
    STATE_KEYS.forEach((key, index) => policy[key] = genome[index]);
    return policy;
}

function tournamentSelect(fitnessScores) {
    const k = 3;
    let best = null;
    for (let i = 0; i < k; i++) {
        const candidate = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
        if (!best || candidate.fitness > best.fitness) best = candidate;
    }
    return best.genome;
}

async function trainMultiThreaded() {
    const numThreads = Math.min(os.cpus().length, 8);
    const botsDir = path.join(__dirname, 'bots');
    const files = fs.readdirSync(botsDir).filter(f => f.endsWith('.js') && !f.includes('evil_meow'));

    const workerScript = path.join(__dirname, 'worker.js');
    const workers = [];
    for (let i = 0; i < numThreads; i++) {
        workers.push(new Worker(workerScript, {
            workerData: { stateKeys: STATE_KEYS, botsDir, files }
        }));
    }

    let population = Array.from({ length: POPULATION_SIZE }, randomGenome);
    let bestGlobalGenome = population[0];
    let bestGlobalFitness = -Infinity;
    let patienceCounter = 0;

    const startTime = Date.now();

    for (let gen = 0; gen < GENERATIONS; gen++) {
        const chunkSize = Math.ceil(POPULATION_SIZE / numThreads);
        const promises = workers.map((worker, index) => {
            return new Promise((resolve) => {
                const chunk = population.slice(index * chunkSize, (index + 1) * chunkSize);
                if (chunk.length === 0) return resolve([]);
                
                worker.once('message', resolve);
                worker.postMessage(chunk);
            });
        });

        const results = await Promise.all(promises);
        const fitnessScores = results.flat();

        fitnessScores.sort((a, b) => b.fitness - a.fitness);

        const currentBest = fitnessScores[0].fitness;
        if (currentBest > bestGlobalFitness + MIN_DELTA) {
            bestGlobalFitness = currentBest;
            bestGlobalGenome = fitnessScores[0].genome;
            patienceCounter = 0;
        } else {
            patienceCounter++;
        }

        if (gen % 50 === 0 || gen === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[GEN ${gen}] Best: ${currentBest.toFixed(4)} | Global Peak: ${bestGlobalFitness.toFixed(4)} | Time: ${elapsed}s | Patience: ${patienceCounter}/${PATIENCE}`);
        }

        if (patienceCounter >= PATIENCE) {
            console.log(`\n[!] Early Stopping at Generation ${gen}!`);
            break;
        }

        let nextGen = [];
        const eliteCount = Math.floor(POPULATION_SIZE * 0.1);
        for (let e = 0; e < eliteCount; e++) {
            nextGen.push(fitnessScores[e].genome);
        }

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

    workers.forEach(w => w.terminate());

    fs.writeFileSync(path.join(__dirname, 'evil_meow_map.json'), JSON.stringify(genomeToPolicy(bestGlobalGenome), null, 2));
    console.log(`\n Evolution Complete! Elapsed Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s | Best score: ${bestGlobalFitness.toFixed(4)}`);
}

trainMultiThreaded().catch(console.error);