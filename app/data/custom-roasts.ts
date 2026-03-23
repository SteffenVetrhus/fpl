/**
 * Custom gameweek roasts — hand-crafted after each gameweek with real data.
 * Update this file after each GW with fresh, targeted roasts.
 */

export interface CustomRoast {
  target: string;
  category: string;
  headline: string;
  body: string;
}

export interface GameweekRoasts {
  gameweek: number;
  summary: string;
  roasts: CustomRoast[];
}

/**
 * All custom roasts, newest gameweek first.
 * After each gameweek: remove old entries, add the latest.
 */
export const customRoasts: GameweekRoasts[] = [
  {
    gameweek: 31,
    summary:
      "Haaland AND Salah both didn't play. Daniel had them as captain AND vice-captain. Rune Oveland burned his Free Hit on Šeško who scored 0. Hans Petter scored 63 to close within 2 points of 2nd. Hill scored -1 for two managers. Carnage.",
    roasts: [
      {
        target: "Daniel W Nilsen",
        category: "Double DNP Disaster",
        headline:
          "Daniel captains Haaland (0) and vice-captains Salah (0). Both didn't play. Both. BOTH.",
        body: "This might be the single worst captain/vice-captain combo in the history of Fantasy Premier League. Haaland — didn't play. Salah — injured, didn't play. Captain: zero. Vice-captain: zero. Combined armband output: absolutely nothing. When BOTH your safety nets have holes in them, that's not bad luck, that's catastrophic planning. He scored 30 points total, with Grealish (0) and Kudus (0) once again contributing their usual nothing. King (13) was his only bright spot — a player he probably picked by accident. 302 points behind Kenneth. At this point Daniel isn't playing FPL, he's doing community service.",
      },
      {
        target: "Rune Oveland Nilsen",
        category: "Free Hit Fraud",
        headline:
          "Rune Oveland uses his FREE HIT — the one chip that lets you pick ANY team — and scores 39 points",
        body: "Let that sink in. A Free Hit. Unlimited transfers. Pick literally anyone. And Rune Oveland looked at the entire Premier League and thought: 'You know what? Captain Šeško.' Šeško scored 0. ZERO. On a Free Hit captain pick. He also brought in Mac Allister (1), Casemiro (1), and Iwobi (1) — three players who combined for the same output as one decent bench fodder player. Bruno Fernandes was RIGHT THERE at 13 points, un-captained. Kelleher (9) and Cash (6) tried to salvage something but the damage was done at the captain screen. 39 points on a Free Hit is like hiring a private chef and ordering toast. The Iron Strikers? The Iron Embarrassment.",
      },
      {
        target: "Hans Petter Omdal",
        category: "GW King",
        headline:
          "Hans Petter tops GW31 with 63 points and is now breathing down Rune Sandaker's neck for 2nd",
        body: "Bruno captain (26 pts), Kelleher (9), Wilson (9), Rogers (6), Szoboszlai (3), Thiago (4). Hans Petter is on a mission. After GW30's 51 points he stepped it up with 63 and has closed the gap to just 2 points behind Rune Sandaker for 2nd place. Two. Points. The Ali Dia redemption arc is real — named after football's greatest fraud, playing like football's greatest genius. Sure, he started Hill (-1) and Gudmundsson (0), but when your captain delivers 26 and your keeper bags 9, you can afford a couple of passengers. Rune Sandaker, check your mirrors.",
      },
      {
        target: "Herman Lundevold",
        category: "Captain Cursed (Again)",
        headline:
          "Herman captains Salah for the second week running. Salah doesn't play. For the second week running.",
        body: "You have to admire the commitment to chaos. GW30: captains Salah, gets 1 point (2 with armband). GW31: captains Salah AGAIN, who this time doesn't even bother showing up — injured, 0 minutes, 0 points. The definition of insanity is doing the same thing twice and expecting different results, and Herman is living proof. The saving grace? King as vice-captain inherited the armband and hauled 13 × 2 = 26 points. Without that safety net, this would have been a funeral. Gordon (10) and Igor Jesus (8) also showed up, dragging Herman to a respectable 53. But 'respectable' is doing heavy lifting when your captain strategy is essentially 'close eyes and pray.' Maatsen (0), Konaté (0), Matheus N. (0) — three defenders contributing nothing. At least he climbed from 7th to 6th. Silver linings and all that.",
      },
      {
        target: "Tor Aslak Austad",
        category: "Bald & Betrayed",
        headline:
          "Tor Aslak captains Haaland who doesn't play, and his vice-captain Ekitiké delivers a rescue package of... 2 points",
        body: "When Haaland didn't play, the armband should have been Tor Aslak's lifeboat. Instead it landed on Ekitiké, who scored 1 point × 2 = 2. That's your captain return for the week: two points. King scored 13 in his team — the actual best player on the pitch — but the armband went to a man who didn't play and a backup who barely did. Wilson (9) and Thiago (4) tried their best, but when your captain combo delivers 2 out of a possible 26 (if he'd just captained King), it's hard to feel anything but pain. Konaté (0) and Van de Ven (1) at the back were decorative at best. Dropped from 6th to 7th. The Bald Beauty continues to be beautiful only in name.",
      },
      {
        target: "Rune Sandaker",
        category: "2nd Place Slipping",
        headline:
          "Rune Sandaker scores 42, watches Hans Petter score 63, and his 2nd place lead shrinks to just 2 points",
        body: "Bruno captain (26) — great. Everything else — not great. Hill scored -1. MINUS ONE. That's not a contribution, that's sabotage. Maguire (0) and Thiaw (0) combined for the same amount as a player who wasn't in the squad. Ekitiké (1), Mbeumo (2), Enzo (2) — the midfield and attack delivered all the excitement of a cancelled match. Meanwhile Hans Petter is 2 points behind and charging like a bull. Rune had a 23-point cushion over 3rd just two gameweeks ago. That cushion is now a napkin. Julebrus? The fizz is going flat.",
      },
      {
        target: "Kenneth Joreid",
        category: "Haaland Bencher",
        headline:
          "Kenneth benches Haaland, Raya, AND Gabriel. All three score 0. This man is playing chess while you play checkers.",
        body: "While three managers captained Haaland and got burned, Kenneth had already benched him. Raya? Benched. Zero. Gabriel? Benched. Zero. That's three premium assets collecting dust on his bench, and every single one of them justified the decision by contributing absolutely nothing. His starting XI of Bruno (C, 26), Gordon (10), Collins (6), Andersen (4), Thiago (4), Szoboszlai (3), Virgil (3) did the business. 61 points, still top by a country mile with 1,908 total. The gap to 2nd is 61 points. Kenneth isn't managing a fantasy team — he's running a masterclass. The rest of you are paying tuition.",
      },
      {
        target: "Steffen Vetrhus",
        category: "João Pedro Truther",
        headline:
          "Steffen captains João Pedro AGAIN. Gets 4 points AGAIN. Bruno scores 13 in his team AGAIN. Learns nothing AGAIN.",
        body: "At what point does this become a medical condition? Two weeks in a row, Steffen has Bruno Fernandes in his team, and two weeks in a row he hands the armband to João Pedro instead. GW30: João Pedro (C) = 4 points, Bruno = 10. GW31: João Pedro (C) = 4 points, Bruno = 13. That's a combined 18-point swing FROM ONE REPEATED DECISION. The good news? The rest of his team actually performed — Watkins (9), Gibbs-White (8), Konsa (6), Tarkowski (6) delivered a solid 61 points. The bad news? It could have been 70 with Bruno as captain. Ctrl Alt Defeat is right — he's defeating himself every single week. Still 8th, £3.6m in the bank, and a captain strategy powered by pure stubbornness.",
      },
      {
        target: "Ronny Sandaker",
        category: "Mid-Table Invisibility",
        headline:
          "Ronny scores 49 points and somehow that's the most boring thing that happened this gameweek",
        body: "In a week where captains didn't play, Free Hits were wasted, and Hill scored -1, Ronny just... existed. Bruno captain (26) was the right call — well done, revolutionary stuff. But then: Chalobah (0), Alderete (1), Ekitiké (1), Amad (2), João Pedro (2). That's five players combining for 6 points. Tarkowski (6) was his second-best player, which tells you everything. His bench scored 0 across four players — Raya, Rice, Semenyo, and O'Reilly all blanked. 49 points. Not bad enough to roast, not good enough to praise. Ronny is the participation trophy of this gameweek. 4 points behind Rune Oveland in 4th — so at least there's that.",
      },
      {
        target: "The Hill Starters",
        category: "Negative Returns",
        headline:
          "Hans Petter and Rune Sandaker both started Hill. Hill scored -1. The man literally subtracted from their totals.",
        body: "In the entire Premier League, with hundreds of players to choose from, two managers in this league independently decided that Neco Hill deserved a starting spot. He repaid their faith by getting a red card / own goal / whatever cursed event produces -1 in FPL. That's not a score, that's a refund request. Hans Petter still topped the gameweek despite Hill's best efforts to sabotage him, which makes it even funnier. Rune Sandaker was less fortunate — Hill's -1 plus Maguire's 0 plus Thiaw's 0 meant three of his defenders contributed negative one point combined. Starting Hill is now a roastable offence in this league.",
      },
      {
        target: "The Haaland Owners",
        category: "Erling No-Show",
        headline:
          "Haaland didn't play in GW31. 6 managers owned him. 5 benched or got burned. Kenneth benched him like a prophet.",
        body: "Six managers had Haaland. Kenneth benched him (genius). Hans Petter benched him (genius). Rune Sandaker benched him (fine). Tor Aslak captained him (disaster — VC Ekitiké got 2). Daniel captained him AND vice-captained Salah who also didn't play (historic catastrophe). Ronny didn't own him (accidentally smart). The man who didn't play in GW31 still caused more emotional damage than any active player. Haaland's 0 points destroyed more dreams than most players' 10-point hauls. And somehow, SOMEHOW, Daniel managed to have both his captain AND vice-captain not play. That takes a special kind of talent.",
      },
    ],
  },
];
