export default function bot({ history = [], memory }) {
    try {
        const t = history.length;
        const mem = memory ?? {
            olivesSent: 0,
            dStreak: 0,
            probed: false,
            armed: false,
            siphoning: false,
        };

        //everything is fair in love and war
        if (t >= 118) return ["D", mem];
        
        if (t === 0) return ["C", mem];
        const last =history[t - 1];
        const prev = t >=2 ? history[t - 2] : null;

        mem.dStreak = (last.you === "D" && last.opponent === "D") ? mem.dStreak + 1 : 0;
        
        // bot gives D up to 3 rounds to see if opponent is conditional
        const allOurMovesC = history.every(r => r.you === "C");
        if (history[0].opponent === "D" && allOurMovesC) {
            if(last.opponent === "C" || t < 3) return ["C", mem];
        }

        //inspiration 001
        const firstD = history.findIndex(r => r.opponent === "D");
        if (firstD !== -1 && (t - firstD >= 4)) {
            const neverForgave = history.slice(firstD).every(r => r.opponent === "D");
            if (neverForgave) return ["D", mem];
        }

        //to shut down alternat moves exploit bot :/
        if (t >= 14 && isRigidPattern(history)) {
            return ["D", mem];
        }

        //round 7 to see TF2T & other nice and simple bots :|
        const oppEverD = history.some(r => r.opponent === "D");
        if (t === 7 && !oppEverD && !mem.probed) {
            mem.probed = true;
            return ["D", mem];
        }

        //Lets see feedback :)
        if (mem.probed && !mem.armed && !mem.siphoning) {
            if (t === 8) {
                return ["C", mem];
            }
            if (t === 9) {
                if (last.opponent === "D") {
                    mem.armed = true;
                }else {
                    mem.siphoning = true;
                }
                return ["C", mem];
            }
        }

        //some harvesting system :@
        if (mem.siphoning) {
            if (last.opponent === "D") {
                mem.siphoning = false;
                return ["C", mem];
            }
            return [t % 2 === 0 ? "D" : "C", mem];
        }

        if (!oppEverD) return ["C", mem];

        const { pC, pD, samplesAfterD } = getRecentState(history, 12);
        const oppDRate = history.filter(r => r.opponent === "D").length / t;

        //nasty play i defect if they never punish D :#
        if (samplesAfterD >= 3 && pD >= 0.45 && oppDRate < 0.35) {
            return ["D", mem];
        }

        //coop with tit for tat bots
        if (pC >= 0.6) {
            const weProvokedThem = last.opponent === "D" && prev?.you === "D";
            if (last.opponent === "D" && !weProvokedThem) return ["D", mem];
            return ["C", mem];
        }

        const ladder = [2, 5, 10, 20];
        const oppEverC = history.some(r => r.opponent === "C");
        if (oppEverC && mem.olivesSent < ladder.length && mem.dStreak >= ladder[mem.olivesSent]) {
            mem.olivesSent++;
            return ["C", mem];
        }

        return ["D", mem];
       } catch {
        return ["D", null];
       }
    }

    function getRecentState(history, windowSize) {
        let cAfterC = 0, nC = 0;
        let cAfterD = 0, nD = 0;
        const start = Math.max(1, history.length - windowSize);

        for (let i = start; i < history.length; i++) {
          const myPrev = history[i - 1].you;
          const theirMove = history[i].opponent;

          if (myPrev === "C") {
            nC++;
            if (theirMove === "C") cAfterC++;
          } else {
            nD++;
            if (theirMove === "C") cAfterD++;
          }
        }

        return {
            pC: (cAfterC + 0.5) / (nC + 1),
            pD: (cAfterD + 0.5) / (nD + 1),
            samplesAfterD: nD,
        };
      }
      
      function isRigidPattern(history) {
        const window = history.slice(-20);
        const moves = window.map(r => r.opponent);
        if (!moves.includes("C") || !moves.includes("D")) return false;

        for (let span = 2; span <= 6; span++) {
            let periodic = true;
            for (let i = span; i < moves.length; i++) {
                if (moves[i] !== moves[i - span]) {
                    periodic = false;
                    break;
                }
            }
            if (periodic) {
                const isEchoingUs = window.slice(1).every((r, idx) => r.opponent === window[idx].you);
                if (!isEchoingUs) return true;
            }
          }
          return false;
      }