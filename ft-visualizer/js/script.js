const RENDER_TYPE = {
  LATEX: 1,
  FUNC: 2,
};
const THRESHOLD = 1e-10;
const LATEX_SIGFIGS = 8;
const FONT = "Courier New";
const FONT_HEIGHT_PX = 16;
const DX = 3;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let state = {};
const initializeState = () => {
  const xLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
  ];
  const yLabels = ["Great", "Good", "Meh", "Bad", "Horrible"];
  return {
    width: canvas.parentElement.clientWidth,
    height: canvas.parentElement.clientHeight,
    xLabels,
    yLabels,
    gridBox: { width: 0.9, height: 0.9 },
    heights: Array(xLabels.length * DX - 1).fill(0),
  };
};

const dft = (
  heights,
  render = RENDER_TYPE.LATEX,
  threshold = THRESHOLD,
  sigfigs = LATEX_SIGFIGS
) => {
  const n = heights.length;
  return Array(n)
    .fill()
    .map((x, w) => {
      const rate = -2 * Math.PI * w;
      const s = heights.reduce(
        (a, x, i) => ({
          re: a.re + x * Math.cos((rate * i) / n),
          im: a.im + x * Math.sin((rate * i) / n),
        }),
        { re: 0, im: 0 }
      );

      Object.entries(s).forEach(
        ([key, value]) =>
          (s[key] = ((Math.abs(value) < threshold ? 0 : 1) * value) / n)
      );

      const amp = Math.sqrt(s.re * s.re + s.im * s.im);
      const phase = Math.atan2(s.im, s.re);

      switch (render) {
        case RENDER_TYPE.LATEX:
          return `${amp.toPrecision(sigfigs)}\\cos\\left(${w}x\\frac{2}{${
            n / DX
          }}\\pi+${phase.toPrecision(sigfigs)}\\right)`;
        case RENDER_TYPE.FUNC:
          return (t) => amp * Math.cos(w * t + phase);
      }
    });
};

const resizeCanvas = ({ width, height }) => {
  canvas.width = width;
  canvas.style.width = width;
  canvas.height = height;
  canvas.style.height = height;
};

const loop = () => {
  const stateChanges = Object.keys(state.diff);
  if (stateChanges.length > 0) {
    state = { ...state, ...state.diff };
    if (
      state.diff.width ||
      state.diff.height ||
      state.diff.xLabels ||
      state.diff.yLabels ||
      state.diff.gridBox
    ) {
      resizeCanvas(state.diff);
      state.gridBoxWidth = state.gridBox.width * state.width;
      state.gridBoxHeight = state.gridBox.height * state.height;

      state.maxYLabelWidth = state.yLabels.reduce(
        (a, label) => Math.max(ctx.measureText(label).width, a),
        -Infinity
      );

      state.topLeftGridPos = {
        x: (state.width - state.gridBoxWidth) / 2 + state.maxYLabelWidth,
        y: (state.height - state.gridBoxHeight) / 2,
      };

      state.bottomRightGridPos = {
        x: state.topLeftGridPos.x + state.gridBoxWidth,
        y: state.topLeftGridPos.y + state.gridBoxHeight,
      };
    }
    if (Object.keys(state.diff).length) draw(state);
    if (state.diff.heights) drawDesmos();
    state.diff = {};
  }

  requestAnimationFrame(loop);
};

const drawLine = (pos1, pos2) => {
  ctx.beginPath();
  ctx.moveTo(pos1.x, pos1.y);
  ctx.lineTo(pos2.x, pos2.y);
  ctx.stroke();
};

const drawDividers = (
  xDividers,
  yDividers,
  topLeftGridPos,
  bottomRightGridPos,
  yLabelPadding
) => {
  xDividers.forEach(({ label, position }) => {
    ctx.fillText(
      label,
      position.x - ctx.measureText(label).width / 2,
      position.y
    );
    drawLine(
      { ...position, y: topLeftGridPos.y },
      { ...position, y: bottomRightGridPos.y }
    );
  });
  yDividers.forEach(({ label, position }) => {
    ctx.fillText(
      label,
      topLeftGridPos.x - yLabelPadding - ctx.measureText(label).width,
      position.y
    );
    drawLine(
      { ...position, x: topLeftGridPos.x },
      { ...position, x: bottomRightGridPos.x }
    );
  });
};

const draw = ({
  heights,
  gridBoxWidth,
  gridBoxHeight,
  topLeftGridPos,
  bottomRightGridPos,
  maxYLabelWidth,
  xLabels,
  yLabels,
  width,
  height,
}) => {
  ctx.clearRect(0, 0, width, height);

  ctx.font = `${FONT_HEIGHT_PX}px ${FONT}`;

  const xDividers = xLabels.map((label, i) => ({
    label,
    position: {
      x: topLeftGridPos.x + (gridBoxWidth / (xLabels.length - 1)) * i,
      y: bottomRightGridPos.y + FONT_HEIGHT_PX,
    },
  }));

  const yDividers = yLabels.map((label, i) => ({
    label,
    position: {
      x: 0,
      y: topLeftGridPos.y + (gridBoxHeight / (yLabels.length - 1)) * i,
    },
  }));

  drawDividers(xDividers, yDividers, topLeftGridPos, bottomRightGridPos, 12);
  let dx = (bottomRightGridPos.x - topLeftGridPos.x) / (heights.length - 1);
  const prevStrokeStyle = ctx.strokeStyle;
  ctx.strokeStyle = "red";
  for (let i = 0; i < heights.length; ++i) {
    const x = dx * i + topLeftGridPos.x;
    drawLine(
      { x, y: (gridBoxHeight / 2) * (1 - heights[i]) + topLeftGridPos.y },
      {
        x: x + dx,
        y: (gridBoxHeight / 2) * (1 - heights[i + 1]) + topLeftGridPos.y,
      }
    );
  }
  ctx.strokeStyle = prevStrokeStyle;
};

const calculator = Desmos.GraphingCalculator(
  document.getElementById("calculator"),
  {
    expressionsCollapsed: true,
    autosize: true,
  }
);
calculator.setMathBounds({
  left: -0.8,
  right: 12,
  bottom: -3,
  top: 3,
});

const drawDesmos = () => {
  const equations = dft(state.heights);

  calculator.setExpression({
    id: `graph-total`,
    latex: equations.map((_x, i) => `y_{${i}}`).join(" + "),
  });
  equations.forEach((x, i) =>
    calculator.setExpression({
      id: `graph${i}`,
      latex: `y_{${i}}=${x}`,
      hidden: true,
    })
  );
};

let isDown = false;
canvas.addEventListener(
  "mousedown",
  (e) => {
    e.preventDefault();
    isDown = true;
  },
  true
);

canvas.addEventListener(
  "mouseup",
  (e) => {
    e.preventDefault();
    isDown = false;
  },
  true
);

canvas.addEventListener(
  "mousemove",
  (e) => {
    e.preventDefault();
    if (isDown) {
      const rect = canvas.getBoundingClientRect();
      const [x, y] = [e.clientX - rect.left, e.clientY - rect.top];

      const {
        topLeftGridPos,
        bottomRightGridPos,
        gridBoxWidth,
        gridBoxHeight,
        heights,
      } = state;
      const delta = Math.ceil(gridBoxWidth / heights.length);
      const bin = Math.min(
        Math.round(Math.max(x - topLeftGridPos.x, 0) / delta),
        heights.length - 1
      );
      heights[bin] = Math.min(
        Math.max(1 - (2 * (y - topLeftGridPos.y)) / gridBoxHeight, -1),
        1
      );
      state.diff.heights = heights;
    }
  },
  true
);

window.addEventListener("resize", () => {
  state.diff = {
    ...state.diff,
    width: canvas.parentElement.clientWidth,
    height: canvas.parentElement.clientHeight,
  };
});

(() => {
  state.diff = initializeState();
  window.requestAnimationFrame(loop);
})();
