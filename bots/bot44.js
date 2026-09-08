export default function ({ history }) {
    if (history.length < 2) 
        return ["D", null]

    let oneback = history[history.length - 1].opponent
    let twoback = history[history.length - 2].opponent

    if (oneback === "D" && twoback === "D")
        return ["D", null]; 
    else
        return ["C", null]; 
    
}
