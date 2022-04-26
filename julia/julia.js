const MIN_ZOOM = 0.0001;
const MAX_ZOOM = 4;
const SLIDER_DIV = 1000;

const gpu = new GPU();
const buildRender = (width, height) => gpu.createKernel(function (maxIterations, cr, ci, centerX, centerY, zoom, colorMultipliers) {
  let zx = (this.output.x / this.output.y) * (centerX + (4 * this.thread.x / this.output.x - 2) * (zoom / 4));
  let zy = centerY + (4 * this.thread.y / this.output.y - 2) * (zoom / 4);
  let iterations = 0;
  for (let i = 0; i < maxIterations; i++) {
    const xtemp = zx * zx - zy * zy + cr;
    zy = 2 * zx * zy + ci;
    zx = xtemp;

    // filled Julia set for Q_c exists only when z has radius less than 2 and less than |c|
    // and we are only allowing |c| < 2
    if (zx * zx + zy * zy > 4) {
      iterations = i;
      break;
    }
  }
  if (iterations == 0 || iterations == maxIterations) {
    this.color(0, 0, 0);
  } else {
    this.color(colorMultipliers[0] * iterations, colorMultipliers[1] * iterations, colorMultipliers[2] * iterations);
  }
}, { output: [width, height], graphical: true });

const canvasHolder = document.getElementById('canvasHolder');
let render; // The GPU kernel built from buildRender
let state = {
  colorMultipliers: [0.01 * Math.random(), 0.03 * Math.random(), 0.02 * Math.random()],
  changes: {
    centerX: 0,
    centerY: 0,
    zoom: 3,
    cr: parseFloat(document.getElementById("realSlider").value) / SLIDER_DIV,
    ci: parseFloat(document.getElementById("imaginarySlider").value) / SLIDER_DIV,
    maxIterations: 1000,
    width: document.body.clientWidth,
    height: document.body.clientHeight,
  },
};

const doRender = (renderF, state) => {
  renderF(state.maxIterations, state.cr, state.ci, state.centerX, state.centerY, state.zoom, state.colorMultipliers);
};

const attachCanvasWithDimension = () => {
  render = buildRender(state.width, state.height);
  doRender(render, state);
  canvasHolder.appendChild(render.canvas);
};

const loop = () => {
  const stateChanges = Object.keys(state.changes);
  if (stateChanges.length > 0) {
    state = {...state, ...state.changes};
    if (state.changes.width || state.changes.height) {
      attachCanvasWithDimension();
    }
    if (state.changes.ci !== undefined) {
      document.getElementById("imag-val").innerHTML = state.ci.toFixed(4);
    }
    if (state.changes.cr !== undefined) {
      document.getElementById("real-val").innerHTML = state.cr.toFixed(4);
    }
    state.changes = {};
    doRender(render, state);
  }

  requestAnimationFrame(loop);
};

loop();


// NOTE: UI code is trash lol
const startImagAnim = () => {
  const start = setInterval(() => {
    if (state.ci >= 1) {
      clearInterval(start);
      document.getElementById("animate-imag").innerHTML = "Animate";
      document.getElementById("animate-imag").onclick = startImagAnim;
      return;
    }

    state.changes.ci = state.ci + 0.001;
    document.getElementById("imaginarySlider").value = state.changes.ci * 1000;
  }, 1000/60);
  document.getElementById("animate-imag").innerHTML = "Stop";
  document.getElementById("animate-imag").onclick = () => {
    clearInterval(start);
    document.getElementById("animate-imag").innerHTML = "Animate";
    document.getElementById("animate-imag").onclick = startImagAnim;
  };
};

const startRealAnim = () => {
  const start = setInterval(() => {
    if (state.cr >= 1) {
      clearInterval(start);
      document.getElementById("animate-real").innerHTML = "Animate";
      document.getElementById("animate-real").onclick = startRealAnim;
      return;
    }

    state.changes.cr = state.cr + 0.001;
    document.getElementById("realSlider").value = state.changes.cr * 1000;
  }, 1000/60);
  document.getElementById("animate-real").innerHTML = "Stop";
  document.getElementById("animate-real").onclick = () => {
    clearInterval(start);
    document.getElementById("animate-real").innerHTML = "Animate";
    document.getElementById("animate-real").onclick = startRealAnim;
  };
};

document.getElementById("realSlider").oninput = function() {
  state.changes.cr = parseFloat(this.value) / SLIDER_DIV;
};

document.getElementById("imaginarySlider").oninput = function() {
  state.changes.ci = parseFloat(this.value) / SLIDER_DIV;
};

canvasHolder.onwheel = (event) => {
  state.changes.zoom = Math.min(Math.max(state.zoom + event.deltaY * 0.001 * state.zoom, MIN_ZOOM), MAX_ZOOM);
}

let isDown = false;
canvasHolder.addEventListener('mousedown', function(e) {
  isDown = true;
}, true);

canvasHolder.addEventListener('mouseup', function() {
  isDown = false;
}, true);

canvasHolder.addEventListener('mousemove', function(event) {
  event.preventDefault();
  if (isDown) {
    let deltaX = -event.movementX * state.zoom / 700;
    let deltaY = event.movementY * state.zoom / 700;
    state.changes.centerX = state.centerX + deltaX;
    state.changes.centerY = state.centerY + deltaY;
  }
}, true);

window.addEventListener('resize', () => {
  state.changes.width = document.body.clientWidth;
  state.changes.height = document.body.clientHeight;
});
