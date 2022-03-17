const global_state = {
  iterations: 0
};

const ALLOWED_ERROR = 0.01;

const randUpTo = (max) => Math.random() * max

const withinError = (a, b, error=ALLOWED_ERROR) => Math.abs(a - b) < error;

const normalize = (vec) => {
  const magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
  return {
    x: vec.x / magnitude,
    y: vec.y / magnitude
  };
}

const findNextIntersection = ({x, y, dx, dy}, max_width, max_height) => {
  const slope = dy / dx;
  const y_intercept = y - (slope * x);
  const intersections = [
    {x: 0, y: y_intercept},
    {x: max_width, y: slope * max_width + y_intercept},
    {x: -y_intercept / slope, y: 0},
    {x: (max_height - y_intercept) / slope, y: max_height}
  ];
  return intersections.find((cross) => {
    const cross_dir_hat = normalize({x: cross.x - x, y: cross.y - y});
    const logo_dir_hat = normalize({x: dx, y: dy});
    const in_bounds = cross.x >= 0 && cross.x <= max_width && cross.y >= 0 && cross.y <= max_height;
    return in_bounds && withinError(cross_dir_hat.x, logo_dir_hat.x) && withinError(cross_dir_hat.y, logo_dir_hat.y);
  });
};

const handleCollision = (obj, max_width, max_height) => {
  const collide_y = obj.y <= 0 || obj.y >= max_height;
  const collide_x = obj.x <= 0 || obj.x >= max_width;

  obj.dx *= (collide_x ? -1 : 1);
  obj.dy *= (collide_y ? -1 : 1);

  return {collide_y, collide_x};
}

const updateLogo = (logo, max_width, max_height) => {
  const {collide_x, collide_y} = handleCollision(logo, max_width, max_height);
  if (collide_y || collide_x) {
    logo.dColorWheel = randUpTo(2*Math.PI)
    logo.onIntersection(logo, max_width, max_height);
  }

  logo.x = Math.max(0, Math.min(logo.x + logo.dx, max_width));
  logo.y = Math.max(0, Math.min(logo.y + logo.dy, max_height));
};

const drawLogo = (logo, element) => {
  element.style.left = `${logo.x}px`;
  element.style.top = `${logo.y}px`;
  element.style.filter = `brightness(0.5) sepia(1) saturate(10000%) hue-rotate(${logo.dColorWheel}rad)`;
}

const makeSvg = (coords) => {
  const makeLine = (a, b, color='white') => `<line x1="${a.x}" x2="${b.x}" y1="${a.y}" y2="${b.y}" stroke="${color}" />`;

  return `
    <svg xmlns='http://www.w3.org/2000/svg' width='${window.innerWidth}px' height='${window.innerHeight}px'>
      <rect x="0" y="0" width="${window.innerWidth}" height="${window.innerHeight}" fill="black"/>
      ${coords.map((_,i) => {
        if (i == 0) {
          return;
        }
        return makeLine(coords[i-1], coords[i], 'red');
      }).join('')}
    </svg>
  `;
}

const setBackgroundToSvg = (svg) => {
  document.getElementById("container").style.background = 'url(data:image/svg+xml;base64,'+btoa(svg)+')';
}

const makeListOfFutureCollisionsAndDraw = (logo, max_width, max_height) => {
  let next_int = {x: logo.x, y: logo.y, dx: logo.dx, dy: logo.dy};
  let intersections = [{...next_int}];

  for (let i = 0; i < global_state.iterations; i++) {
    const next = findNextIntersection(next_int, max_width, max_height);
    next_int.x = next.x;
    next_int.y = next.y;
    handleCollision(next_int, max_width, max_height);
    intersections.push(next);
  }

  // Transform each intersection to the center of the logo
  intersections.map((x) => {
    x.x += logo.width/2;
    x.y += logo.height/2;
  });

  setBackgroundToSvg(makeSvg(intersections));
};

let drawNewPaths;
window.onload = () => {
  const dvdLogo = document.getElementById("dvd-logo");
  let logo = {
    x: Math.floor(randUpTo(window.innerWidth-dvdLogo.clientWidth)),
    y: Math.floor(randUpTo(window.innerHeight-dvdLogo.clientHeight)),
    dx: 2,
    dy: 2,
    width: dvdLogo.clientWidth,
    height: dvdLogo.clientHeight,
    onIntersection: makeListOfFutureCollisionsAndDraw,
    dColorWheel: 0
  };
  setInterval(() => {
    updateLogo(logo, window.innerWidth-logo.width, window.innerHeight-logo.height);
    drawLogo(logo, dvdLogo);
  }, 22);

  drawNewPaths = () => makeListOfFutureCollisionsAndDraw(logo, window.innerWidth-logo.width, window.innerHeight-logo.height);
  drawNewPaths();
  window.onresize = drawNewPaths;

  document.getElementById("iteration-slider").value = global_state.iterations;
  document.getElementById("iteration-count").innerHTML = `${global_state.iterations} iterations`;
}

document.getElementById("iteration-slider").oninput = function() {
  global_state.iterations = parseInt(this.value, 10);
  document.getElementById("iteration-count").innerHTML = `${global_state.iterations} iterations`;
  drawNewPaths();
}

