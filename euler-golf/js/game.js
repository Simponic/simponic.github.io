const DEFAULTS = {
  max_rows: 80,
  max_cols: 80,
  min_gap: 30,
  angle_multiplier: 10e-4,
};

const CANVAS = document.getElementById("canvas");

let state = {
  grid_padding: 30,
  gap: DEFAULTS.min_gap,
  canvas: CANVAS,
  ctx: CANVAS.getContext("2d"),
  last_render: 0,
  keys: {},
  changes: {},
};

// Rendering
CanvasRenderingContext2D.prototype.circle = function (x, y, r, color) {
  this.beginPath();
  this.arc(x, y, r, 0, Math.PI * 2);
  this.fillStyle = color;
  this.fill();
  this.closePath();
};

CanvasRenderingContext2D.prototype.line = function (
  { x_pos: x1, y_pos: y1 },
  { x_pos: x2, y_pos: y2 },
  width,
  color,
  cap = "round"
) {
  this.lineWidth = width;
  this.strokeStyle = color;
  this.lineCap = cap;

  this.beginPath();
  this.moveTo(x1, y1);
  this.lineTo(x2, y2);
  this.stroke();
  this.closePath();
};

CanvasRenderingContext2D.prototype.draw_cartesian_path = function (
  grid_spec,
  cartesian_path,
  width = 2,
  color = "#fff"
) {
  const path = cartesian_path.map((coord) => grid_to_canvas(coord, grid_spec));
  path.slice(1).forEach((coord, i) => {
    this.line(path[i], coord, width, color);
  });
};

CanvasRenderingContext2D.prototype.do_grid = function (
  rows,
  cols,
  draw_at_grid_pos = (ctx, x, y) => ctx.circle(x, y, 10, "#44ff44")
) {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      draw_at_grid_pos(this, x, y);
    }
  }
};

CanvasRenderingContext2D.prototype.cartesian_grid = function (
  rows,
  cols,
  grid_spec,
  circle_spec_at_coords = (_x, _y) => ({ radius: 5, color: "#000" })
) {
  this.do_grid(rows, cols, (ctx, x, y) => {
    const { x_pos, y_pos } = grid_to_canvas({ x, y }, grid_spec);
    const { radius, color } = circle_spec_at_coords(x, y);

    ctx.circle(x_pos, y_pos, radius, color);
  });
};

// Utilities
const move = (prev, curr, c) => cx.add(prev, cx.mult(c, cx.sub(curr, prev)));

const rand_between = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rand_target = (rows, cols) => {
  const r = Math.floor((rows - 1) / 2);
  const c = Math.floor((cols - 1) / 2);
  const res = new cx(rand_between(-c, c), rand_between(-r, r));
  if (!sol(res)) return rand_target(rows, cols);

  return res;
};

const calculate_grid_spec = ({ rows, cols, width, height, grid_padding }) => {
  const dx = (width - 2 * grid_padding) / cols;
  const dy = (height - 2 * grid_padding) / rows;

  return {
    dx,
    dy,
    start_x: grid_padding + dx / 2,
    start_y: grid_padding + dy / 2,
  };
};

const grid_to_canvas = ({ x, y }, { dx, dy, start_x, start_y }) => ({
  x_pos: x * dx + start_x,
  y_pos: y * dy + start_y,
});

const complex_to_grid = (c, rows, cols) => {
  const { re, im } = c;
  return {
    x: re + Math.floor(cols / 2),
    y: Math.floor(rows / 2) - im,
  };
};

// Game loop

const maybe_add_state_angle_move = ({ angle } = state) => {
  if (angle.im <= -1 || angle.im >= 1) {
    angle.im = angle.im <= -1 ? -1 : 1;
    state.path.push(move(state.path.at(-2), state.path.at(-1), angle));
    state.angle = new cx(0, 0);
  }
  return state;
};

const handle_input = (state, dt) => {
  if (state.keys.ArrowLeft) {
    state.angle.im += DEFAULTS.angle_multiplier * dt;
  } else if (state.keys.ArrowRight) {
    state.angle.im -= DEFAULTS.angle_multiplier * dt;
  }
  state = maybe_add_state_angle_move(state);
};

const render = ({ width, height, ctx, rows, cols, target, gap } = state) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, width, height);

  const grid_spec = calculate_grid_spec(state);

  const curr = state.path.at(-1);
  const prev = state.path.at(-2);

  const v_diff = cx.sub(curr, prev);
  const theta = (state.angle.im * Math.PI) / 2;

  const angle_re = Math.cos(theta) * v_diff.re - Math.sin(theta) * v_diff.im;
  const angle_im = Math.sin(theta) * v_diff.re + Math.cos(theta) * v_diff.im;

  ctx.draw_cartesian_path(grid_spec, [
    ...state.path.map((c) => complex_to_grid(c, rows, cols)),
    complex_to_grid(cx.add(new cx(angle_re, angle_im), prev), rows, cols),
  ]);

  if (!(state.angle.im == state.angle.re && state.angle.re == 0)) {
    // Draw path to next player's target
    const [a, b] = [
      curr,
      move(prev, curr, new cx(0, state.angle.im < 0 ? -1 : 1)),
    ].map((c) => grid_to_canvas(complex_to_grid(c, rows, cols), grid_spec));

    ctx.line(a, b, 6, "rgba(127, 127, 127, 0.3)");
  }

  const grid_target = complex_to_grid(target, rows, cols);
  ctx.cartesian_grid(rows, cols, grid_spec, (x, y) => {
    if (x == Math.floor(cols / 2) && y == Math.floor(rows / 2)) {
      return {
        radius: 7,
        color: "#2f9c94",
      };
    } else if (x == grid_target.x && y == grid_target.y) {
      return {
        radius: 8,
        color: "#fff",
      };
    } else {
      return {
        radius: 3,
        color: `rgb(${255 * (x / cols)}, 100, 100)`, // todo: animate with last_render
      };
    }
  });

  // Render gap value in slider
  document.getElementById("gap").value = gap;
};

const loop = (now) => {
  const dt = now - state.last_render;
  state.changes.last_render = now;

  if (Object.keys(state.changes).length > 0) {
    state = { ...state, ...state.changes };

    if (state.changes.width || state.changes.height || state.changes.gap) {
      state.rows = Math.floor(state.height / state.gap);
      state.cols = Math.floor(state.width / state.gap);
    }

    state.changes = {};
  }

  if (!state.target) state.target = rand_target(state.rows, state.cols);

  if (!state.solution) {
    handle_input(state, dt);
  } else {
    if (!state?.solution.length) {
      delete state.solution;
    } else {
      state.angle.im +=
        (state.solution[0] === "-" ? 1 : -1) * DEFAULTS.angle_multiplier * dt;

      state = maybe_add_state_angle_move(state);

      if (cx.eq(state.angle, new cx(0, 0))) state.solution.shift();
    }
  }
  render(state);
  requestAnimationFrame(loop);
};

const reset_state = ({ rows, cols } = state) => ({
  ...state,
  solution: null,
  path: [new cx(0, 0), new cx(1, 0)],
  angle: new cx(0, 0),
});

// DOM
const directions_modal = new Modal({
  el: document.getElementById("directions-modal"),
});

const on_resize = () => {
  CANVAS.width = document.body.clientWidth;
  CANVAS.height = document.body.clientHeight;
  state.changes.width = CANVAS.width;
  state.changes.height = CANVAS.height;
};

const on_keyup = (e) => {
  delete state.keys[e.key];
};

const on_keydown = (e) => {
  state.keys[e.key] = true;
};

window.addEventListener("resize", on_resize);
window.addEventListener("keydown", on_keydown);
window.addEventListener("keyup", on_keyup);

// main
on_resize();
state = reset_state(state);

if (!sessionStorage.getItem("seen-instructions")) {
  directions_modal.show();
  sessionStorage.setItem("seen-instructions", true);
}

requestAnimationFrame(loop);
