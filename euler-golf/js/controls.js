const directions_modal = new Modal({
  el: document.getElementById("directions-modal"),
});

document
  .getElementById("controls-container")
  .addEventListener("mouseover", () => {
    document.getElementById("controls").style.display = "block";
    document.getElementById("expand-show").style.display = "none";
  });
document
  .getElementById("controls-container")
  .addEventListener("mouseout", () => {
    document.getElementById("controls").style.display = "none";
    document.getElementById("expand-show").style.display = "inline";
  });

document.getElementById("reset").addEventListener("click", () => {
  state = reset_state(state);

  state.target = rand_target(state.rows, state.cols);
});

document.getElementById("solve").addEventListener("click", () => {
  if (!cx.eq(state.path.at(-2), new cx(0, 0))) state = reset_state(state);

  state.solution = sol(state.target);
});

document
  .getElementById("directions")
  .addEventListener("click", () => directions_modal.show());
