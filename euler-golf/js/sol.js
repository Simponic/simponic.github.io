const DEPTH = 7;

const DIRECTION = {
  0: new cx(0, 1),
  1: new cx(0, -1),
};

const move = (prev, curr, c) => cx.add(prev, cx.mult(c, cx.sub(curr, prev)));
const construct_moves = (curr, prev) =>
  Object.keys(DIRECTION).map((x) => move(curr, prev, DIRECTION[x]));
const backtrack = (local_index, depth) =>
  local_index
    .toString(2)
    .padStart(depth, "0")
    .split("")
    .reverse()
    .map((dir) => (dir ? "+" : "-"));

const sol = (target, start_from = new cx(0, 0), start_to = new cx(1, 0)) => {
  let moves = construct_moves(start_from, start_to);
  let curr_depth = 2; // potential bug: when target is within one move away

  do {
    for (let i = 0; i < Math.pow(2, curr_depth); i++) {
      const current_i =
        (i >> 1) + ((1 - Math.pow(2, curr_depth - 1)) / (1 - 2) - 1);
      const previous_i =
        (i >> 2) + ((1 - Math.pow(2, curr_depth - 2)) / (1 - 2) - 1);

      const new_move = move(
        previous_i < 0 ? start_from : moves[previous_i],
        moves[current_i],
        DIRECTION[parseInt(i.toString(2)[0])]
      );

      if (cx.eq(new_move, target)) return backtrack(moves, target);

      moves.push(new_move);
    }
    curr_depth++;
  } while (curr_depth < DEPTH);
  console.log(moves);
  return null;
};
