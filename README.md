# Phoenix Golf Addicts — 2026 Tournament Tracker

A shared scoreboard for the P.G.A. trip: 8 players, 6 rounds, 6 courses,
net match play. Published as a Claude Artifact so the group scores from their
phones against the same live state.

## What gets entered

Two plain number fields per player per round, and nothing else:

| Field | Meaning |
|---|---|
| **Gross** | The player's gross score for the round |
| **Pts** | Points earned for the competition that round |

Course handicaps, pops and hole-by-hole match play are worked out on the course,
not in the app. The app records the result and does the running tally.

Points follow the tournament sheet — 1 per hole won, +0.5 for the match win,
0.25 each on a tie. A points entry above the sheet's stated 12.5 per-round
maximum is flagged in red but still accepted; nothing is truncated.

## Using it

- **Rounds** — the only place scores go in. Each round collapses to a header;
  the first round still missing entries opens by default. Match winners and the
  round's status update as you type. Closest to the pin is set per round.
- **Standings** — running points by round, total, and total gross. Rounds with
  nothing entered read `—` rather than 0.
- **Rules** — format, points table, local rules, pace of play, prizes, CTP holes.
- **Setup** — player names, matchups per round, CTP hole. Matchups are seeded
  with a round-robin so nobody repeats an opponent across the six rounds.

Two players sharing a name are flagged in Setup: standings track each slot
separately, so duplicates split a player's points across two rows.

## Development

`index.html` is generated — edit `src/shell.html` and rebuild:

```
python3 build.py
```

The page carries a base64 copy of its own template so it can republish itself
with new state. `build.py` substitutes the two markers exactly once, asserts the
template round-trips, and rejects any non-ASCII in the shell (the self-template
is base64'd as ASCII, so a stray em dash breaks the round trip — use HTML
entities in markup and `\uXXXX` escapes in JS strings).

Editing `src/shell.html` by script: assert on every replacement. A silently
missed anchor produces a page that passes `node --check` and fails at runtime.
