export default function bottle({history, memory}){
    let n = history.length - 1
    let move
    let C = 0
    let opp
    if (history.length == 0){
        move = "C"
    }
    else{
        opp = history[n].opponent
        if(opp == "C"){
            C += 1
        }

        if(memory > 0&&C > 2){
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
    return [move, memory]
}