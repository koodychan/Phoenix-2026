# Phoenix Golf Addicts — 2026 Tournament Tracker

A shared, phone-first scoreboard for the P.G.A. trip: 8 players, 6 rounds,
6 courses, net match play. Published as a Claude Artifact so everyone in the
group scores from their own phone against the same live state.

## Format it implements

Net match play, singles, 4 matches per round. Course handicap is calculated
per round from Handicap Index, Slope, Course Rating and Par. The higher
course handicap player gets a pop on each of the hardest handicap holes, up
to the differential.

| | Points |
|---|---|
| Each hole won | 1 |
| Hole halved or lost | 0 |
| Winner of the match | +0.5 |
| Match tied — each player | +0.25 |

## Before round 1

Open **Setup** and fill in, in this order:

1. **Players and Handicap Index** — all 8. Until slope/rating are entered,
   the index is used as the course handicap, so the app is usable immediately.
2. **Stroke index by hole** — copy from each course's scorecard. This decides
   *which* holes the pops land on, so it matters more than anything else here.
3. **Course rating and slope** — turns the index into a real course handicap.
4. **Matchups** — pre-seeded with a round-robin so nobody repeats an opponent
   across the 6 rounds. Change freely.

Par defaults to 4s; correct it per hole if you want the par column to read true.

## Scoring a round

Rounds → tap a match → enter gross scores hole by hole. Net, pops (amber
dots), hole winner, match status and points all update live. Closest to the
pin is set from the row at the bottom of each round card.

## Notes

- Points are computed **uncapped** from the rules above. The sheet's "maximum
  12.5 per round" is reachable (12 holes won + the 0.5 match point) but is not
  a hard ceiling — winning 13 holes scores 13.5. Nothing truncates it.
- The 0.5 / 0.25 match point is included live, from the current state of the
  match, so standings read as projected until a match finishes.

## Development

`index.html` is generated — edit `src/shell.html` and rebuild:

```
python3 build.py
```

The page carries a base64 copy of its own template so it can republish itself
with new state; `build.py` substitutes the two markers exactly once and
asserts the template round-trips.
