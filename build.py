#!/usr/bin/env python3
"""Build index.html for the Phoenix Golf Addicts tracker.

The page carries a base64 copy of its own template so it can republish
itself with new state; markers are substituted exactly once here.
"""
import argparse, base64, json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

# Names as entered by the group in the live artifact.
PLAYERS = ["Kyle Maughan", "Scott Maughn", "Jacob Ferrell", "Jeff Vielstich",
           "Jed Barney", "Eric Pehrson", "Burke Plummer", "Stewart Jensen"]

ROUNDS = [
    ("Wednesday", "Aug 26", "Boulders Golf Club",     "South Course", ["1:00 pm", "1:10 pm"],   15),
    ("Thursday",  "Aug 27", "We-Ko-Pa Golf Club",     "Cholla",       ["7:30 am", "7:40 am"],   14),
    ("Thursday",  "Aug 27", "We-Ko-Pa Golf Club",     "Saguaro",      ["1:40 pm", "1:50 pm"],    9),
    ("Friday",    "Aug 28", "Gold Canyon Golf Resort","Dinosaur",     ["7:10 am", "7:20 am"],    8),
    ("Friday",    "Aug 28", "Gold Canyon Golf Resort","Sidewinder",   ["12:15 pm", "12:24 pm"], 10),
    ("Saturday",  "Aug 29", "Wildfire Golf Club",     "Faldo Course", ["7:55 am", "8:05 am"],   17),
]


def pairings(rnd):
    """Circle-method round robin: 8 players, a different opponent each round."""
    others = [1, 2, 3, 4, 5, 6, 7]
    rot = others[rnd:] + others[:rnd]
    order = [0] + rot
    return [(order[i], order[7 - i]) for i in range(4)]


def initial_state():
    players = [{"id": "p%d" % (i + 1), "name": n} for i, n in enumerate(PLAYERS)]
    rounds = []
    for i, (day, date, club, course, times, ctp) in enumerate(ROUNDS):
        pids = [p["id"] for p in players]
        rounds.append({
            "id": "r%d" % (i + 1), "n": i + 1,
            "day": day, "date": date, "club": club, "course": course,
            "times": times, "ctpHole": ctp, "ctp": "",
            "matches": [{"a": pids[a], "b": pids[b]} for a, b in pairings(i)],
            "gross": {}, "points": {},
        })
    # ahead of any state the previous build may have left behind
    return {"rev": 200, "players": players, "rounds": rounds}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--state", metavar="FILE",
                    help="embed this state JSON instead of a fresh tournament. Use to carry "
                         "the live artifact's data across a code change; rev is bumped so the "
                         "rebuilt page wins over anything the old build left behind.")
    opts = ap.parse_args()

    shell = open(os.path.join(ROOT, "src/shell.html"), encoding="utf-8").read()
    for mark in ("__SHELL_B64__", "__STATE_JSON__"):
        if shell.count(mark) != 1:
            sys.exit("marker %s appears %d times, expected 1" % (mark, shell.count(mark)))

    b64 = base64.b64encode(shell.encode("ascii")).decode("ascii")

    if opts.state:
        data = json.load(open(opts.state, encoding="utf-8"))
        data["rev"] = int(data.get("rev", 0)) + 1
        print("embedding %s (rev %d, %d players)" % (opts.state, data["rev"], len(data["players"])))
    else:
        data = initial_state()
    state = json.dumps(data, separators=(",", ":")).replace("<", "\\u003c")

    out = shell.split("__SHELL_B64__")
    out = b64.join(out)
    out = out.split("__STATE_JSON__")
    out = state.join(out)

    # the embedded template must round-trip to the shell byte for byte
    assert base64.b64decode(b64).decode("ascii") == shell, "self-template mismatch"

    path = os.path.join(ROOT, "index.html")
    open(path, "w", encoding="utf-8").write(out)
    print("wrote %s  (%.1f KB)" % (path, len(out) / 1024.0))


if __name__ == "__main__":
    main()
