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
    gameweek: 30,
    summary:
      "Kenneth ran riot with 79 points while half the league captained Haaland for a grand total of 2. Herman and Daniel scraped 27 each. Pain was distributed generously.",
    roasts: [
      {
        target: "Kenneth Joreid",
        category: "GW Overlord",
        headline:
          "Kenneth drops 79 points and makes the rest of you look like you're playing a different sport",
        body: "Bruno Fernandes captain (20 pts), Szoboszlai (11), Gordon (11), Gabriel (9), O.Dango (8), Raya (7). That's not a gameweek, that's a public execution. Kenneth is now 42 points clear at the top and the only thing growing faster than his lead is everyone else's frustration. At this point you're not competing with Kenneth — you're competing for second place, and even that's slipping away.",
      },
      {
        target: "Herman Lundevold",
        category: "Captain Catastrophe",
        headline:
          "Herman captains Salah, who delivers a heroic 1 point. One. Uno. En.",
        body: "In a gameweek where Bruno Fernandes hauled 10 points, Herman strapped the armband on Mo Salah and got rewarded with a grand total of 2 points (1 × 2). To make it worse, José Sá in goal delivered a clean 0, while Dúbravka sat on the bench with 6 points, literally screaming to be played. Gordon scored 11, which was nice — shame about the other 10 players. '1/2 finsk sisu'? More like 0% sisu. Your team selection has the tactical awareness of a blindfolded dartboard throw.",
      },
      {
        target: "Daniel W Nilsen",
        category: "Season Over",
        headline:
          "Daniel scores 27, benches 0, and is now closer to relegation from life than from 8th place",
        body: "Grealish: 0. Kudus: 0. Van de Ven: 0. Tarkowski: 0. That's four players who collectively contributed absolutely nothing, like bringing four mannequins to a football match. Captain Haaland squeezed out 2 points (4 with armband), which was somehow his best decision. 271 points behind Steffen in 8th. His bench scored a combined 0 — because even his backup players have given up. Squad value of £97.9m, the lowest in the league. Daniel isn't at rock bottom — rock bottom would be an improvement.",
      },
      {
        target: "Steffen Vetrhus",
        category: "Wildcard Wasteman",
        headline:
          "Steffen makes 5 transfers, scores 39 points, and proves that activity ≠ intelligence",
        body: "Five transfers. FIVE. That's not squad management, that's a nervous breakdown with an internet connection. After all that shuffling, he captained João Pedro — who scored 2 points (4 with the armband). Meanwhile, Watkins contributed a fat 0. Steffen is sitting on £3.6m in the bank with the cheapest squad value in the league (£99.3m). You've got money, you've got free transfers, you've got options — and yet somehow you consistently choose violence against yourself. Ctrl Alt Defeat? More like Ctrl Alt Delete your season.",
      },
      {
        target: "Rune Oveland Nilsen",
        category: "Haaland Truther",
        headline:
          "Rune Oveland slaps the armband on Haaland. Haaland says 'no thanks' and scores 2",
        body: "Captain Haaland: 4 points. The man has Dúbravka sitting on his bench with 6, and Garner with 4 — both outscoring his captain. Petrović in goal was actually his top performer with 6 points, which tells you everything about how the rest of the team played. Jensen and Semenyo contributed a combined 4 points from midfield. When your goalkeeper is your best outfield decision, it's time to question every life choice that led you here. The Iron Strikers? More like The Iron Curtain — nothing gets through, especially not points.",
      },
      {
        target: "Ronny Sandaker",
        category: "João Pedro Enjoyer",
        headline:
          "Ronny captains João Pedro over Bruno Fernandes and gets exactly what he deserves",
        body: "Let this sink in: Bruno Fernandes was RIGHT THERE, in Ronny's team, and he chose to captain João Pedro instead. Bruno scored 10. João Pedro scored 2 (4 with armband). That's a 16-point swing from one decision. ONE decision. Raya kept a clean sheet for 7 points, which was nice, but the damage was already done the moment that armband went on Pedro. With £2.5m in the bank, Ronny has the money to upgrade but seemingly not the judgment. Ekitiké's 1 point was the cherry on this disaster sundae.",
      },
      {
        target: "Tor Aslak Austad",
        category: "Bald Fraud",
        headline:
          "The Bald Beauty scores 37 points — nothing beautiful about this performance",
        body: "Another Haaland captain truther punished for their faith — 2 points from the Norwegian giant (4 with C). Timber got 1 point, which is what you get for trusting an Arsenal defender named after building materials. Estève (6) and Raya (7) tried their best to carry, but when your captain returns 4 points and your midfield of Rayan (3), Wilson (3), and Semenyo (2) combines for 8, you're basically running a charity, not a fantasy team. 'The Bald Beauty'? Today it was The Bald and the Beaten.",
      },
      {
        target: "Hans Petter Omdal",
        category: "Ali Why-a",
        headline:
          "Hans Petter captains Thiago, gets 12 points, and calls it a strategy",
        body: "Look, 51 points isn't terrible — but let's talk about the choices. Captain Thiago (12 pts) over Bruno Fernandes (10) — okay, that actually worked. But then we have Kelleher in goal with 1 point while Dúbravka (6) watched from the bench. Timber (1) at the back did his usual impression of a training cone. And Ali Dia? The team is named after the most famous fraud in football history, and honestly, some of these picks live up to the name. At least Gudmundsson's -2 was safely on the bench — small mercies.",
      },
      {
        target: "Rune Sandaker",
        category: "Benchwarmer's Curse",
        headline:
          "Rune benches Dúbravka (6) and Stach (5), plays Ekitiké (1) — make it make sense",
        body: "53 points sounds respectable until you look at the bench: Dúbravka (6), Stach (5), Maguire (1), Mukiele (0). That's 12 points rotting in the reserves — with 11 of those coming from just two players he chose not to play. Meanwhile, Ekitiké delivered 1 point from the starting XI. Mbeumo got 2. Enzo got 2. At least the Bruno captaincy (20 pts) saved this from being a complete embarrassment. Julebrus? More like Julebust this week.",
      },
      {
        target: "The Entire League",
        category: "Dúbravka Disrespect",
        headline:
          "7 out of 9 managers owned Dúbravka. 6 of them benched him. He scored 6 points.",
        body: "This is a league-wide sickness. Almost everyone had Dúbravka, and almost everyone decided he wasn't good enough to start — then watched him outscore half their starting XIs from the bench. Rune Oveland, Ronny, Tor Aslak, Hans Petter, Herman, and Rune Sandaker all left him gathering dust. Only Steffen and Kenneth (who benched/started respectively) got this right. It's like collectively agreeing to shoot yourselves in the foot and then being surprised it hurts.",
      },
      {
        target: "The Haaland Captainers",
        category: "Erling Disappointment",
        headline:
          "3 managers captained Haaland. He scored 2 points. Combined captain return: 12.",
        body: "Rune Oveland, Tor Aslak, and Daniel all trusted the big Norwegian with the armband in GW30. Haaland rewarded their loyalty with 2 points — the FPL equivalent of a slap in the face. Meanwhile, Kenneth captained Bruno for 20 points. That's a 16-point gap from one decision, repeated across three managers who all independently made the same terrible choice. At least you have each other. Misery loves company, and this is a support group.",
      },
    ],
  },
];
