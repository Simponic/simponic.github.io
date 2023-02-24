const CANVAS_ID = "myCanvas";
const DEFAULTS = {
  rows: 15,
  cols: 15,
  grid_padding: 10,
};

let state = {
  ...DEFAULTS,
  canvas: document.getElementById("canvas"),
  ctx: document.getElementById("canvas").getContext("2d"),
  last_render: 0,
  changes: {
    width: document.body.clientWidth,
    height: document.body.clientHeight,
  },
};

const rand_between = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rand_target = (cols, rows) => {
  const res = new cx(rand_between(0, cols), rand_between(0, rows));
  if (res.re % 2 || res.im % 2) return rand_target(cols, rows);

  return res;
};

CanvasRenderingContext2D.prototype.circle = function (x, y, r, color) {
  this.beginPath();
  this.arc(x, y, r, 0, Math.PI * 2);
  this.fillStyle = color;
  this.fill();
  this.closePath();
};

CanvasRenderingContext2D.prototype.line = function (
  { x: x1, y: y1 },
  { x: x2, y: y2 },
  width,
  color,
  cap = "round"
) {
  this.beginPath();
  this.moveTo(x1, y1);
  this.lineTo(x2, y2);
  this.lineWidth = width;
  this.strokeStyle = color;
  this.lineCap = cap;
  this.stroke();
  this.closePath();
};

CanvasRenderingContext2D.prototype.do_grid = function (
  rows,
  cols,
  draw_at_grid_pos = (ctx, x, y) => ctx.circle(x, y, 10, "#00ff00")
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
  width,
  height,
  grid_padding,
  circle_spec_at_coords = (x, y) => ({ radius: 5, color: "#000" })
) {
  const center = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };

  const dx = (width - 2 * grid_padding) / cols;
  const dy = (height - 2 * grid_padding) / rows;

  const start_x = grid_padding + dx / 2;
  const start_y = grid_padding + dy / 2;

  this.do_grid(rows, cols, (ctx, x, y) => {
    const x_pos = x * dx + start_x;
    const y_pos = y * dy + start_y;
    const { radius, color } = circle_spec_at_coords(x, y);

    ctx.circle(x_pos, y_pos, radius, color);
  });
};

const render = ({ canvas, ctx, rows, cols, grid_padding }) => {
  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.cartesian_grid(rows, cols, width, height, grid_padding, (x, y) => {
    if (x == Math.floor(cols / 2) && y == Math.floor(rows / 2)) {
      return {
        radius: 7,
        color: "#0000ff",
      };
    } else {
      return {
        radius: 3,
        color: "#000",
      };
    }
  });
};

const loop = (now) => {
  const dt = now - state.last_render;
  state.changes.last_render = now;
  if (Object.keys(state.changes).length > 0) {
    state = { ...state, ...state.changes };
    state.changes = {};

    render(state);
  }

  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
