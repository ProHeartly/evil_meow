const TEST=8, NEED=2

export default function bot({history:h=[],memory:m}){
	m=m&&typeof m=="object"?m:{d:0,b:0}
	m.d=Number.isFinite(m.d)?m.d:0
	m.b=Number.isFinite(m.b)?m.b:0

	if(!h.length)return["C",m]

	const x=h.at(-1).opponent

	if(x=="D"){
		m.d++
		if(m.d>=NEED)m.b=1
	}else{
		m.d=0
	}

	if(m.b)return["D",m]

	if(m.d>=TEST)
		return["C",(m.d=0,m)]

	return[x=="C"?"C":"D",m]
}