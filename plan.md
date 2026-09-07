SOooooo for original meow version, it got really bad.. what if we trained like a model??? i mean we first make a simulator to simulate it

okayy, now the simulation part is doneee!!!..... NOW lets make kinda model and a way to train the model ;D

okayy, now since bot's architecture is kinda done and simulation is also kinda done, lets move to making training sim part ;D


# okok about the how model is gonna workkk!

The bot uses lookup table to choose its next move based on a dynamic state representation and we train it in kinda reinforcement style simulation :)

round 0: starts by cooperation
round 1: looks up 2-character outcome of the first round (e.g. CC, CD, DC or DD)
rount 2+: constructs a 7-part state string combining recent history and opponent stastics.

the state formula: (for rounds n >= 2)

'{round n - 2}_\{round n - 1}\_{P}\_{F}'

where, round data are stored like CC.. first string denotes you and second opponent
and, P means purity flag (P = Pure/forgiving, T = Tainted/Punishing)
also, F is just frequency category.. (L = LOW, M = MEDIUM, H = HIGH)

this allows our bot to compress data into a lookup table type style and play according to it.

# DISCLAMER: ITS JUST A TEST, THIS MIGHT WORK, OR WORST SCORE less than 1 cuz it didn't get trained properly..