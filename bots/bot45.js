export default function bot({ history, memory }) {
  const C = "C", D = "D", n = history.length;

  if (n === 0) return [D, { version: 1 }];


  const models = ["AD", "AC", "TFT", "PAV", "GRIM", "RAND"];
  const logp = [-Math.log(6), -Math.log(6), -Math.log(6), -Math.log(6), -Math.log(6), -Math.log(6)];
  const eps = 0.015;
  let grimTriggered = false;

  for (let i = 1; i < n; i++) {
    if (history[i - 1].opponent === D) grimTriggered = true;
    const prev = history[i - 1];
    const actual = history[i].opponent;
    const predictions = [
      D,
      C,
      prev.you,
      prev.you === prev.opponent ? prev.opponent : (prev.opponent === C ? D : C),
      grimTriggered ? D : C,
      null,
    ];
    for (let j = 0; j < predictions.length; j++) {
      const p = predictions[j] === null ? 0.5 : (predictions[j] === actual ? 1 - eps : eps);
      logp[j] += Math.log(p);
    }
  }

  const peak = Math.max(...logp);
  let total = 0;
  for (let i = 0; i < logp.length; i++) total += Math.exp(logp[i] - peak);
  const posterior = logp.map(x => Math.exp(x - peak) / total);
  const pHard = posterior[0] + 0.65 * posterior[4];
  const pReciprocal = posterior[2] + posterior[3];
  const last = history[n - 1];
  let move = D;


  if (n === 1) {
    move = D;
  } else if (last.opponent === D) {
    move = D;
  } else if (pHard > 0.72 || history.every(x => x.opponent === D)) {
    move = D;
  } else if (last.you === C && last.opponent === C) {
    move = C;
  } else if (last.you === C && last.opponent === D) {
    move = D;
  } else if (last.you === D && last.opponent === C) {
    move = D;
  } else if (last.you === D && last.opponent === D) {
    move = pReciprocal > pHard + 0.08 ? C : D;
  }

  if (n > 8 && pReciprocal < 0.25 && last.opponent === D) move = D;
  return [move === C || move === D ? move : D, memory || { version: 1 }];
}