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
      "GW31 was a crime scene. Haaland & Salah both ghosted. Daniel duct-taped both armbands to corpses anyway. Rune turned his Free Hit into performance art of failure. Hans Petter is one step away from eating 2nd place alive. Hill scored -1 because apparently some people deserve to be punished. Welcome to hell.",
    roasts: [
      {
        target: "Daniel W Nilsen",
        category: "Captaincy War Crime",
        headline:
          "Daniel captains Haaland (DNP) and vice-captains Salah (DNP). Armband returns: 0 + 0 = clinical depression speedrun.",
        body: "This isn't a mistake — this is a cry for institutionalisation. Both flagship assets didn't even lace up and Daniel still found a way to staple the armbands to their hospital beds. 30 points from the whole squad. Grealish & Kudus doing their signature 0+0 double act. King dropped 13 like he felt sorry for the rest of the team. 302 points adrift of Kenneth — that's not a gap, that's a different sport. Daniel isn't competing in FPL anymore; he's the cautionary tale they tell new players on day one. Next season just Venmo Kenneth the buy-in and save everyone the public humiliation.",
      },
      {
        target: "Rune Oveland Nilsen",
        category: "Free Hit Funeral",
        headline:
          "Rune blows his Free Hit — infinite budget, infinite dreams — and limps home with 39 points and Šeško (C) on 0. Actual war crime against competence.",
        body: "Free Hit is the one moment you're allowed to feel like a god. Rune used it to roleplay as a village idiot with a keyboard. Captain Šeško → 0. Mac Allister (1) + Casemiro (1) + Iwobi (1) = three typing errors masquerading as midfielders. Bruno Fernandes (13) was literally begging to be captained and Rune said 'nah, I'm good'. 39 points on unlimited transfers is like getting a supermodel date and taking her to McDonald's drive-thru alone. The Iron Strikers died so the Rust Corpses could be born. Rune just set the record for most expensive way to lose dignity.",
      },
      {
        target: "Hans Petter Omdal",
        category: "Sociopath in Form",
        headline:
          "Hans Petter scores 63, Bruno(C) 26, still starts Hill (-1), and is now 2 points from curb-stomping Rune Sandaker out of 2nd. Psychopath behaviour.",
        body: "Even with Hill trying to actively sabotage him (-1) and Gudmundsson blanking (0), he still tops the GW because Bruno, Kelleher & Wilson decided to carry his corpse to victory. The Ali Dia fraud nickname is officially retired — this is straight-up serial killer efficiency. 2 points behind 2nd and closing like a great white smelling blood. Rune Sandaker should probably change his locks and sleep in a different county. Hans Petter isn't on a redemption arc anymore; he's the final boss of the mini-league and everyone else is just cannon fodder waiting to be deleted.",
      },
      {
        target: "Herman Lundevold",
        category: "Pathological Salah Truther",
        headline:
          "Herman captains Salah for the SECOND consecutive week → second consecutive DNP/blank. This man needs to be sectioned, not supported.",
        body: "GW30: Salah (C) → 2 pts total. GW31: Salah (C) → injured ghost → 0. He is emotionally married to disappointment and refuses to sign the divorce papers. King (VC → 26) literally saved him from posting the lowest score since the invention of decimal points. Gordon (10) & Igor Jesus (8) dragged the carcass to 53, but make no mistake — this is a man who keeps jumping into the same woodchipper expecting a different outcome. Maatsen/Konaté/Matheus N all on 0 — defense looking like police tape around his decision-making. Climbed to 6th purely because other people are even more brain-dead. Herman, if you're reading this: therapy isn't expensive compared to the therapy you'll need after another Salah blank.",
      },
      {
        target: "Tor Aslak Austad",
        category: "Bald & Brain-Dead",
        headline:
          "Tor captains Haaland (DNP). VC Ekitiké inherits → 2 points. That's not captaincy, that's assisted suicide of his own rank.",
        body: "Haaland doesn't play → armband auto-passes to Ekitiké → 1×2=2. King was on his bench scoring 13 like 'bro you had one job'. Instead Tor chose the DNP → bargain-bin forward pipeline. Wilson (9) & Thiago (4) showed up to the funeral but couldn't revive the patient. Konaté (0) + Van de Ven (1) — backline so useless they should be investigated for match-fixing. Dropped to 7th. Bald on the outside, even balder upstairs. The Bald Beauty? More like The Bald Butchery. Next time just flip a coin — it can't do worse than you.",
      },
      {
        target: "Rune Sandaker",
        category: "2nd Place Death Spiral",
        headline:
          "Rune scores 42. Hill goes -1 IN HIS TEAM. Hans Petter drops 63. 23-point buffer → 2-point panic attack in two GWs. Enjoy the freefall.",
        body: "Bruno (C-26) was the only adult in the room. Hill (-1) literally subtracted joy from the universe. Maguire (0) + Thiaw (0) = defensive black hole event horizon. Ekitiké/Mbeumo/Enzo combining for 5 points like they're allergic to form. Hans Petter is 2 points behind and accelerating like he's trying to qualify for F1. That 23-point lead you had? It evaporated faster than your self-respect. Julebrus? More like Jule-bury-me-now. Better start writing your 3rd-place acceptance speech because 2nd is already in the rear-view mirror getting smaller.",
      },
      {
        target: "Kenneth Joreid",
        category: "League Overlord & Sadist",
        headline:
          "Kenneth benches Haaland, Raya & Gabriel — all blank. Starts Bruno(C) 26 and coasts to 61. 61-point lead at the top. This isn't FPL, it's public execution.",
        body: "While clowns were captaining Haaland into the sun, Kenneth treated him like radioactive waste and was proven correct in real time. Same with Raya & Gabriel. Bench premiums = 0 contribution, zero guilt. Starting XI clinically dismantled the gameweek. 1,908 total. Gap to 2nd = 61 points = basically another full team's worth of advantage. The league isn't competitive anymore; it's Kenneth's personal Saw trap and you're all strapped to the table watching him monologue. Pay your respects, send your apologies, and never speak his name in vain again. He's not winning — he's collecting scalps.",
      },
      {
        target: "Steffen Vetrhus",
        category: "Terminal João Pedro Brainrot",
        headline:
          "Steffen captains João Pedro → 4 pts. Again. Bruno scores 13. Again. 18-point self-harm over two weeks. This is a diagnosable personality disorder.",
        body: "Same crime, same victim, same weapon, zero remorse. GW30: João (C) 4, Bruno 10. GW31: João (C) 4, Bruno 13. He's so deep in copium he's naming his first-born João Pedro Fernandes. Watkins/Gibbs-White/Konsa/Tarkowski gave him a respectable 61 — which only makes the captain blunder more criminal. Could've been 70+ if he wasn't emotionally handcuffed to mediocrity. £3.6m ITB and still captaining like someone held at gunpoint in 2022. Ctrl Alt Defeat? More like Ctrl Alt Permanent Brain Damage. Steffen, we're starting a GoFundMe for your dignity. It's fully funded already — by everyone laughing at you.",
      },
      {
        target: "Ronny Sandaker",
        category: "Human White Noise",
        headline:
          "Ronny scores 49 in the bloodiest GW of the season and still manages to be the single most forgettable thing that happened.",
        body: "Bruno (C-26) — wow, he discovered fire. Then immediately: Chalobah (0), Alderete (1), Ekitiké (1), Amad (2), João Pedro (2) — five players combining for six points like they're on a collective work-to-rule. Tarkowski (6) was literally his second-best asset. Bench all blanks. 49 points. Not tragic enough to meme, not good enough to remember. Ronny exists in that special mid-table purgatory where you're too irrelevant to roast properly, yet too present to ignore. 4 points behind Rune Oveland — congrats on being the slightly less beige version of beige. Your highlight reel is just static.",
      },
      {
        target: "The Hill Starters",
        category: "Certified Liability",
        headline:
          "Hans Petter AND Rune Sandaker started Hill → -1. They paid fantasy points to watch a man get himself sent off / OG / cursed into existence.",
        body: "In a universe of 500+ viable options, two separate managers said 'yes, Neco Hill starts today'. He repaid them with -1 — the rare negative-value special. Hans Petter still won the GW (making the sabotage almost performance art). Rune got pulled into the abyss with him. Starting Hill during a blank week should carry a mandatory points fine and public flogging. If your lineup contains Hill and anything bad happens, it's not bad luck — it's karma collecting on your terrible life choices.",
      },
      {
        target: "The Haaland Owners",
        category: "Collective Trauma",
        headline:
          "Haaland DNP. 6 owners. 5 suffer immediate karmic justice. Daniel manages to make BOTH captain AND vice-captain vanish. Legendary suffering.",
        body: "Haaland didn't play and still single-handedly caused more breakdowns than every mid-table team combined. Kenneth & Hans Petter benched him like prophets. Tor captained him then watched Ekitiké mercy-kill the armband for 2. Daniel? Captain Haaland (0) + VC Salah (0) — the FPL equivalent of drinking bleach and chasing it with more bleach. Six owners, five victims, one god-tier troll in Daniel who ascended to meme immortality through sheer volume of pain inflicted on himself. Haaland's blank GW destroyed more mental health than most players' 20-point hauls ever create. Daniel deserves a plaque in the hall of ultimate self-destruction.",
      },
    ],
  },
];
