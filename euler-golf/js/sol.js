const DEPTH = 22;

const DIRECTION = {
  0: new cx(0, 1),
  1: new cx(0, -1),
};

const construct_moves = (curr, prev) =>
  Object.keys(DIRECTION).map((x) => move(curr, prev, DIRECTION[x]));

const backtrack = (local_index, depth) =>
  local_index
    .toString(2)
    .padStart(depth, "0")
    .split("")
    .map((direction) => (Number(direction) ? "-" : "+"));

const sol = (target, start_from = new cx(0, 0), start_to = new cx(1, 0)) => {
  let moves = [start_to, ...construct_moves(start_from, start_to)];
  let curr_depth = 2;

  while (curr_depth < DEPTH) {
    for (let i = 0; i < Math.pow(2, curr_depth); i++) {
      const direction = DIRECTION[Number(i.toString(2).at(-1))];
      // Current element is at i >> 1 + the offset for the previous group (which is
      // the sum of the geometric series 2**n until curr_depth - 1)
      const current_i = (i >> 1) + (1 - Math.pow(2, curr_depth - 1)) / (1 - 2);
      const previous_i = (i >> 2) + (1 - Math.pow(2, curr_depth - 2)) / (1 - 2);

      const new_move = move(moves[previous_i], moves[current_i], direction);

      moves.push(new_move);
      if (cx.eq(new_move, target)) return backtrack(i, curr_depth);
    }
    curr_depth++;
  }

  return null;
};
