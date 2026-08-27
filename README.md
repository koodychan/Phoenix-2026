# Phoenix Golf Addicts — 2026 Tournament Tracker

A shared scoreboard for the P.G.A. trip: 8 players, 6 rounds, 6 courses,
net match play. Published as a Claude Artifact so the group scores from their
phones against the same live state.

## What gets entered

One number per player per round: the points they earned for the competition.

Gross scores, course handicaps, pops and hole-by-hole match play are all worked
out on the course, not in the app. The app records the result and does the
running tally.

Points follow the tournament sheet — 1 per hole won, +0.5 for the match win,
0.25 each on a tie. A points entry above the sheet's stated 12.5 per-round
maximum is flagged in red but still accepted; nothing is truncated.

## Using it

- **Rounds** — the only place scores go in. Each round collapses to a header;
  the first round still missing entries opens by default. Every matchup is its
  own bordered card with a `vs` divider, so the two players in a pair read as a
  pair rather than running together with the next one. Match winners and the
  round's status follow from the points as you type. Closest to the pin is set
  per round.
- **Standings** — running points by round and total. Rounds with nothing
  entered read `—` rather than 0.
- **Rules** — format, points table, local rules, pace of play, prizes, CTP holes.
- **Setup** — password protected. Player names, matchups per round, CTP hole,
  and the Clear-all-scores button all sit behind it. Each round warns if a
  player lands in two matches or none, which is easy to do halfway through
  re-pairing a round.

The Setup password is a **speed bump, not security**. The page is client-side,
so the check and its digest both ship to the browser and anyone willing to open
dev tools can get past it. It exists to stop accidental edits by the group, and
scoring is deliberately left open to everyone.

The stored value is a djb2 digest rather than the literal password, so the word
is not sitting in the page source. Input is trimmed and lower-cased before
hashing, so a phone auto-capitalising the first letter still gets in. Unlocking
is remembered per browser in `localStorage`; a Lock button in the Players
heading clears it. To change the password, hash the new one and replace
`SETUP_PW`:

```
node -e 'var s="newpass",h=5381;for(var i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;console.log(h.toString(36))'
```

Matchups come from the group's own schedule sheet (`MATCHUPS` in `build.py`),
which is a 6-of-7 round robin: 24 distinct pairings, no repeats, every player
facing six different opponents. The sheet groups each round into two tee times;
that ordering is preserved in the match list but is not labelled in the app.

Two players sharing a name are flagged in Setup: standings track each slot
separately, so duplicates split a player's points across two rows.

The Pts column label lives in the first matchup card's header rather than in a
row above the cards, so it shares the entry grid and stays aligned without
hard-coded offsets.

## Development

`index.html` is generated — edit `src/shell.html` and rebuild:

```
python3 build.py                          # fresh tournament
python3 build.py --state live_state.json  # keep the live artifact's data
python3 build.py --state live.json --set-matchups   # also reapply the sheet
```

`--set-matchups` overwrites every round's pairings from the schedule sheet. It
is off by default so a routine `--state` rebuild keeps matchups edited in the
app. `matches_for()` asserts each round fields all eight players exactly once,
so a typo in the table fails the build rather than reaching the group.

Republishing over a live artifact replaces its embedded state, so before
shipping a code change pull the current state out of the published page
(`<script id="pga-state">`) and pass it to `--state`. The rev is bumped so the
rebuilt page wins over whatever the previous build left behind.

The page carries a base64 copy of its own template so it can republish itself
with new state. `build.py` substitutes the two markers exactly once, asserts the
template round-trips, and rejects any non-ASCII in the shell (the self-template
is base64'd as ASCII, so a stray em dash breaks the round trip — use HTML
entities in markup and `\uXXXX` escapes in JS strings).

Editing `src/shell.html` by script: assert on every replacement. A silently
missed anchor produces a page that passes `node --check` and fails at runtime.

Deleting a CSS rule by regex needs the same care. A rule whose declarations wrap
onto a second line will leave that line orphaned, and an orphaned declaration
swallows the *next* rule into an invalid selector — the stylesheet still loads,
so nothing errors, the following rule just never applies. `tools/csscheck.js`
catches this by diffing every selector in the source against the CSSOM the
browser actually parsed:

```
node tools/csscheck.js
```
