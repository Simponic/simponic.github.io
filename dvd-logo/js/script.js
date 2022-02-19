const randUpTo = (max) => Math.random() * max

const randomHue = (element) => {
  element.style.filter = `brightness(0.5) sepia(1) saturate(10000%) hue-rotate(${randUpTo(360)}deg)`;
}

const clamp = (val, max) => val > max ? max : val;


const updateLogo = (logo, element) => {
  const screen_height = window.innerHeight;
  const screen_width = window.innerWidth;

  const collide_y = logo.y <= 0 || (logo.y + element.clientHeight) >= screen_height;
  const collide_x = logo.x <= 0 || (logo.x + element.clientWidth) >= screen_width;

  logo.dx *= (collide_x ? -1 : 1);
  logo.dy *= (collide_y ? -1 : 1);

  if (collide_y || collide_x) {
    randomHue(element);
  }

  // Clamp in case user changes screen size
  logo.x = clamp(logo.x + logo.dx, screen_width - element.clientWidth);
  logo.y = clamp(logo.y + logo.dy, screen_height - element.clientHeight);

  element.style.left = `${logo.x}px`;
  element.style.top = `${logo.y}px`;
};

window.onload = () => {
  let logo = {
    x: randUpTo(window.innerWidth),
    y: randUpTo(window.innerHeight),
    dx: 2,
    dy: 2
  };
  const dvdLogo = document.getElementById("dvd-logo");

  setInterval(() => updateLogo(logo, dvdLogo), 15); // ~ 67 hz
}
