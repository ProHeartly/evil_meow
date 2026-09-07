export default function bot({ history }) {
  if (history.length === 0) {
    return ["C", null] // Start by cooperating
  }

  const { you, opponent } = history.at(-1)

  const move = opponent === "C"
    ? you                          // win → stay
    : (you === "C" ? "D" : "C")    // lose → shift

  return [move, null]
}