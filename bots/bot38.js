export default function bottlev2({history, memory}){
    let n = history.length - 1
    let move
    let C
    let opp
    let D
    const opp0 = history[0]
    const opp1 = history[1]
    const opp2 = history[2]
    if (history.length == 0){
        move = "C"
    }
    else{
        opp = history[n].opponent
        if(opp == "C"){
            C = 1
        }
        else if(opp == "D"){
            D += 1
        }
        if(D > 2){
            if(memory > 0&&C > 0){
                move = "C"
                memory = 0
                C = 0
            }
            else if (memory > 0){    
             move = "D"
            }
            else if(opp == "C"){
               move = "C"
            }
            else if (opp == "D"){
              move = "D"
              memory = 1
            }
        }
        else if(opp0 === "D"&& opp1 === "C"&& opp2 === "C"){
            move = "D"
        }
        else{
            if(memory > 0&&C > 0){
                move = "C"
                memory = 0
                C = 0
            }
            else if (memory > 0){    
             move = "D"
            }
            else if(opp == "C"){
               move = "C"
            }
            else if (opp == "D"){
              move = "D"
              memory = 1
            }
        }
    }
    return [move, memory]
}