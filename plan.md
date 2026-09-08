SOooooo for original meow version, it got really bad.. what if we trained like a model??? i mean we first make a simulator to simulate it

okayy, now the simulation part is doneee!!!..... NOW lets make kinda model and a way to train the model ;D

okayy, now since bot's architecture is kinda done and simulation is also kinda done, lets move to making training sim part ;D

might be done with train logic.. yah i think we are done with thisss.. now lemme do get some bots to /bots dir ;)

sooo I brought out some lb bots and some other random bots so our bot can train on them :D

althought its working, it's preety slowww..... HOLY SHIEETT its really slowww... I think i can optimize this into little beteter.. IT TOOK ME about 5 min to go from 150 to 200 so it will took ages in this speed

much better.. i think but still sloww... 

HMMM I think using multi thread and worker can increase the speed of trainig! I also added a early stop setting to ensure not over working umm here we check if bot is working to improve or not.. if it isn't working for improving or stuck in same thing with micro adjustment without significant advantage, it terminates.

Hmmm seems like good score 🤔 what if we increase patience lvl

uhmmmmm that 2.04 seems good enoughhhh T-T.. lets try to do some small tweaks and see if i can theoritically increase thiss.. and lets also make rounds like 100, 125 and 150 so only strong policies survive instead of luck

let's add a small feature.. allowing the bot to understand its own behaviour and develop more advanced strategy

# okok about the how model is gonna workkk!

The bot uses lookup table to choose its next move based on a dynamic state representation and we train it in kinda reinforcement style simulation :)

round 0: starts by cooperation
round 1: looks up 2-character outcome of the first round (e.g. CC, CD, DC or DD)
rount 2+: constructs a 7-part state string combining recent history and opponent stastics.

the state formula: (for rounds n >= 2)

'{round n - 2}_\{round n - 1}\_{P\_opp}\_{F\_opp}\_{P\_me}\_{F\_me}'

where, round data are stored like CC.. first string denotes you and second opponent
and, P means purity flag (P = Pure/forgiving, T = Tainted/Punishing)
also, F is just frequency category.. (L = LOW, M = MEDIUM, H = HIGH)

and _opp means of opponent where as _me means bot's

this allows our bot to compress data into a lookup table type style and play according to it.
