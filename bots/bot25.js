export default state => {
  return [Math.random() < 0.6 ? "D" : "C", state.memory]
}