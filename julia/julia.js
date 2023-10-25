const MIN_ZOOM = 0.0001;
const MAX_ZOOM = 4;
const C_THRESHOLD = Math.sqrt(2)/2;
const SLIDER_DIV = 2000*C_THRESHOLD;

const gpu = new GPUX();
const buildRender = (width, height) => gpu.createKernel(function (maxIterations, cr, ci, centerX, centerY, zoom, colorMultipliers) {
  let zx = (this.output.x / this.output.y) * (centerX + (4 * this.thread.x / this.output.x - 2) * (zoom / 4));
  let zy = centerY + (4 * this.thread.y / this.output.y - 2) * (zoom / 4);
  let iterations = 0;
  for (let i = 0; i < maxIterations; i++) {
    const xtemp = zx * zx - zy * zy + cr;
    zy = 2 * zx * zy + ci;
    zx = xtemp;
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
  colorMultipliers: [0.01 * Math.random() + 0.015, 0.03 * Math.random() + 0.007, 0.02 * Math.random() + 0.010],
  changes: {
    centerX: 0,
    centerY: 0,
    zoom: 3,
    cr: parseFloat(document.getElementById('realSlider').value) / SLIDER_DIV,
    ci: parseFloat(document.getElementById('imaginarySlider').value) / SLIDER_DIV,
    maxIterations: 1000,
    width: document.body.clientWidth,
    height: document.body.clientHeight,
  },
};

const doRender = (renderF, state) => {
  // gpu.js doesn't support JS objects as kernel parameters - https://github.com/gpujs/gpu.js/issues/245
  renderF(state.maxIterations, state.cr, state.ci, state.centerX, state.centerY, state.zoom, state.colorMultipliers);
};

const loop = () => {
  const stateChanges = Object.keys(state.changes);
  if (stateChanges.length > 0) {
    state = {...state, ...state.changes};
    if (state.changes.width || state.changes.height) {
      render = buildRender(state.width, state.height);
      canvasHolder.appendChild(render.canvas);
    }
    if (typeof state.changes.ci !== 'undefined') {
      document.getElementById('imag-val').value = state.ci.toFixed(4);
      document.getElementById('imaginarySlider').value = state.changes.ci * SLIDER_DIV;
    }
    if (typeof state.changes.cr !== 'undefined') {
      document.getElementById('real-val').value = state.cr.toFixed(4);
      document.getElementById('realSlider').value = state.changes.cr * SLIDER_DIV;
    }
    state.changes = {};
    doRender(render, state);
  }

  requestAnimationFrame(loop);
};

loop();

// UI Code

const startAnim = (sliderId, complexComponentName='ci') => {
  const restart = (interval) => {
    clearInterval(interval);
    document.getElementById(sliderId).innerHTML = 'Animate';
    document.getElementById(sliderId).onclick = ()=>startAnim(sliderId, complexComponentName);
    return;
  };
  const start = setInterval(() => {
    if (state[complexComponentName] >= C_THRESHOLD) {
      restart(start);
    }

    state.changes[complexComponentName] = state[complexComponentName] + 0.001;
  }, 1000/60);
  document.getElementById(sliderId).innerHTML = 'Stop';
  document.getElementById(sliderId).onclick = ()=>restart(start);
};

document.getElementById('imaginarySlider').oninput = function() {
  state.changes.ci = parseFloat(this.value) / SLIDER_DIV;
};
document.getElementById('realSlider').oninput = function() {
  state.changes.cr = parseFloat(this.value) / SLIDER_DIV;
};

document.getElementById('imag-val').addEventListener('change', function (e) {
  state.changes.ci = parseFloat(this.value);
});
document.getElementById('real-val').addEventListener('change', function (e) {
  state.changes.cr = parseFloat(this.value);
});

canvasHolder.addEventListener('wheel', (e) => {
  e.preventDefault();
  state.changes.zoom = Math.min(Math.max(state.zoom + e.deltaY * 0.001 * state.zoom, MIN_ZOOM), MAX_ZOOM);
});

let isDown = false;
canvasHolder.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDown = true;
}, true);

canvasHolder.addEventListener('mouseup', (e) => {
  e.preventDefault();
  isDown = false;
}, true);

canvasHolder.addEventListener('mousemove', (e) => {
  e.preventDefault();
  if (isDown) {
    let deltaX = -e.movementX * state.zoom / document.body.clientWidth;
    let deltaY = e.movementY * state.zoom / document.body.clientHeight;
    state.changes.centerX = state.centerX + deltaX;
    state.changes.centerY = state.centerY + deltaY;
  }
}, true);

window.addEventListener('resize', () => {
  state.changes.width = document.body.clientWidth;
  state.changes.height = document.body.clientHeight;
});
