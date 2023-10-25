const MESSAGES = {
  SET_CELL: "SET_CELL",
  PAUSE: "PAUSE",
  SIMULATE: "SIMULATE",
  SET_READER: "SET_READER",
  NEXT_STEP: "NEXT_STEP",
  COMPILE: "COMPILE",
  COMPILE_STATUS: "COMPILE_STATUS",
  NEW_TURING_STATE: "NEW_TURING_STATE",
};

const state = new Observable();

const inputCellId = (cellId) => `${cellId}-input`;

const setCellFromInput = (cellId, inputId) => {
  const input = document.getElementById(inputId);
  tape[cellId] = input.value;
};

const cell = (cellId, initValue = "NULL") => {
  const cellDiv = document.createElement("div");
  cellDiv.classList.add("cell");
  cellDiv.id = cellId;

  const readingHead = document.createElement("div");
  readingHead.classList.add("circle");

  const input = document.createElement("input");
  const inputId = inputCellId(cellId);
  input.classList.add("cell-input");
  input.id = inputId;
  input.value = initValue;

  input.addEventListener("focusin", () =>
    state.notify({ type: MESSAGES.PAUSE })
  );
  input.addEventListener("focusout", () =>
    state.notify({ type: MESSAGES.SET_CELL, cell: cellId, value: input.value })
  );
  state.subscribe((msg) => {
    if (msg.type == MESSAGES.SET_CELL && msg.cell == cellId) {
      input.value = msg.value;
    }
    if (msg.type == MESSAGES.SET_READER) {
      if (msg.cell == cellId) {
        cellDiv.classList.add("reading");
        cellDiv.scrollIntoView({
          behavior: "smooth",
        });
      } else cellDiv.classList.remove("reading");
    }
  });

  cellDiv.appendChild(input);
  cellDiv.appendChild(readingHead);

  return cellDiv;
};

const parseRules = (rules, beginState) => {
  const quadruples = rules.split("\n");

  const instructions = [];
  quadruples.forEach((quadruple, line) => {
    const commentLess = quadruple.replaceAll(/\/\/.*/g, "").trim();
    if (!commentLess) {
      return;
    }

    const items = commentLess
      .split(" ")
      .map((x) => x.trim())
      .filter((x) => x);
    if (items.length != 4) {
      throw new Error(`Invalid instruction on line ${line}`);
    }
    instructions.push(items);
  });
  if (!instructions.some(([fromState]) => fromState == beginState)) {
    throw new Error(
      `At least one instruction must begin from state: ${beginState}`
    );
  }
  return instructions;
};

// --

const tapeEl = document.getElementById("tape");
const compileButton = document.getElementById("compile");
const instructionsEl = document.getElementById("instructions");
const controlsEl = document.getElementById("controls");
const nextStepButton = document.getElementById("next_step");
const togglePlayButton = document.getElementById("toggle_play");
const compileStatusEl = document.getElementById("compile_status");
const turingMachineStateEl = document.getElementById("turing_state");
const resetButton = document.getElementById("reset");

resetButton.addEventListener("click", () => {
  state.notify({ type: MESSAGES.PAUSE });
  state.notify({ type: MESSAGES.COMPILE, value: instructionsEl.value });
});

compileButton.addEventListener("click", () => {
  state.notify({ type: MESSAGES.COMPILE, value: instructionsEl.value });
});

nextStepButton.addEventListener("click", () => {
  state.notify({ type: MESSAGES.PAUSE });
  state.notify({ type: MESSAGES.NEXT_STEP });
});

let playButton_simulationStatus = "paused";
togglePlayButton.addEventListener("click", function () {
  if (playButton_simulationStatus == "paused") {
    state.notify({ type: MESSAGES.SIMULATE });
  } else if (playButton_simulationStatus == "simulate") {
    state.notify({ type: MESSAGES.PAUSE });
  }
});

state.subscribe((msg) => {
  if (msg.type == MESSAGES.COMPILE_STATUS) {
    const { error, success } = msg;
    if (error) {
      compileStatusEl.classList.remove("success");
      compileStatusEl.classList.add("error");
      compileStatusEl.innerHTML = error;
    }
    if (success) {
      compileStatusEl.classList.add("success");
      compileStatusEl.classList.remove("error");
      compileStatusEl.innerHTML = `Successful compile at ${new Date().toLocaleString()}!`;
    }
  }
});

state.subscribe((msg) => {
  if (msg.type == MESSAGES.COMPILE_STATUS) {
    const { error, success } = msg;
    if (error) {
      controlsEl.style.display = "none";
    } else if (success) {
      controlsEl.style.display = "block";
    }
  }
});

state.subscribe((msg) => {
  if (msg.type == MESSAGES.PAUSE) {
    togglePlayButton.innerHTML = "🔁 Begin";
    playButton_simulationStatus = "paused";
  }
  if (msg.type == MESSAGES.SIMULATE) {
    togglePlayButton.innerHTML = "⏸️ Pause";
    playButton_simulationStatus = "simulate";
  }
});

state.subscribe((msg) => {
  if (msg.type == MESSAGES.NEW_TURING_STATE) {
    turingMachineStateEl.innerHTML = msg.value;
  }
});

// -

const main = () => {
  const blank = "B";
  const beginState = "q0";
  const acceptState = "f";
  const tape = Array(200).fill(blank);
  const cells = tape.map((_, cellId) => cell(cellId, blank));
  for (const cell of cells) {
    tapeEl.appendChild(cell);
  }

  let turingMachine;

  state.subscribe((msg) => {
    if (msg.type == MESSAGES.SET_CELL) {
      const { value, cell } = msg;
      tape[cell] = value;
      if (turingMachine) turingMachine.setTapeAtCell(cell, value);
    }
    if (msg.type == MESSAGES.COMPILE) {
      const { value } = msg;
      try {
        const rules = parseRules(value, beginState, acceptState);

        turingMachine = new TuringMachine(
          [...tape],
          rules,
          beginState,
          blank,
          acceptState
        );
        state.notify({ type: MESSAGES.SET_READER, cell: 0 });
        state.notify({
          type: MESSAGES.NEW_TURING_STATE,
          value: turingMachine.getStateStatus(),
        });
        state.notify({ type: MESSAGES.COMPILE_STATUS, success: true });
      } catch (e) {
        state.notify({ type: MESSAGES.COMPILE_STATUS, error: e.toString() });
      }
    }
    if (msg.type == MESSAGES.SIMULATE) {
      const interval = setInterval(() => {
        state.notify({ type: MESSAGES.NEXT_STEP });
      }, 300);
      const subscriptionFn = (msg) => {
        if (msg.type == MESSAGES.PAUSE) {
          clearInterval(interval);
          state.unsubscribe(subscriptionFn);
        }
      };
      state.subscribe(subscriptionFn);
    }
    if (msg.type == MESSAGES.NEXT_STEP && turingMachine) {
      const step = turingMachine.step();

      const status = turingMachine.getStateStatus();

      const cell = turingMachine.getHead();

      if (!step) {
        const accepting = turingMachine.isAccepting();
        state.notify({
          type: MESSAGES.NEW_TURING_STATE,
          value: accepting
            ? `<span class='success'>Accept(${status})</span>`
            : `<span class='error'>Fail(${status}}</span>`,
        });
      } else {
        state.notify({
          type: MESSAGES.NEW_TURING_STATE,
          value: status,
        });
      }

      state.notify({
        type: MESSAGES.SET_READER,
        cell,
      });
      state.notify({
        type: MESSAGES.SET_CELL,
        cell,
        value: turingMachine.getTapeAtCell(cell),
      });

      if (!step)
        state.notify({
          type: MESSAGES.PAUSE,
        });
    }
  });
};
main();
