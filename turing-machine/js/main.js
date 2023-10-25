const TAPE_LEN = 150;
const BLANK_VAL = "B";
const SIMULATION_INTERVAL = 200;

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

// -- the "real" code

const state = new Observable();

const inputCellId = (cellId) => `${cellId}-input`;

const cell = (cellId, initValue = "B") => {
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

  const msgListener = (msg) => {
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
    if (msg.type == MESSAGES.COMPILE) {
      state.unsubscribe(msgListener);
    }
  };
  state.subscribe(msgListener);

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
      throw new Error(`Invalid instruction on line ${line + 1}`);
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

// -- a bit of some hacky ui code --

const tapeEl = document.getElementById("tape");
const compileButton = document.getElementById("compile");
const resetButton = document.getElementById("reset");
const controlsEl = document.getElementById("controls");
const nextStepButton = document.getElementById("next_step");
const togglePlayButton = document.getElementById("toggle_play");
const compileStatusEl = document.getElementById("compile_status");
const turingMachineStateEl = document.getElementById("turing_state");
const copyStateButton = document.getElementById("copy_state");

// init instructions from params
const instructionsEl = document.getElementById("instructions");
const editorEl = CodeMirror.fromTextArea(instructionsEl, {
  lineNumbers: true,
});
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("instructions")) {
  editorEl.setValue(atob(urlParams.get("instructions")));
}

[compileButton, resetButton].forEach((button) =>
  button.addEventListener("click", () => {
    state.notify({ type: MESSAGES.PAUSE });
    state.notify({ type: MESSAGES.COMPILE, value: editorEl.getValue() });
  })
);

nextStepButton.addEventListener("click", () => {
  state.notify({ type: MESSAGES.PAUSE });
  state.notify({ type: MESSAGES.NEXT_STEP });
});

// hackily copy the program state and put it in the clipboard
copyStateButton.addEventListener("click", () => {
  const start = Array(TAPE_LEN)
    .fill(BLANK_VAL)
    .map((blank, i) => document.getElementById(inputCellId(i))?.value ?? blank)
    .join("")
    .replaceAll(new RegExp(`(${BLANK_VAL})*\$`, "g"), "");
  const instructions = btoa(editorEl.getValue());

  navigator.clipboard
    .writeText(
      window.location.href.split("?")[0] +
        `?start=${start}&instructions=${instructions}`
    )
    .then(() => alert("copied to clipboard"));
});

// simulate / pause button
let playButton_simulationStatus = "paused";
togglePlayButton.addEventListener("click", function () {
  if (playButton_simulationStatus == "paused") {
    state.notify({ type: MESSAGES.SIMULATE });
  } else if (playButton_simulationStatus == "simulate") {
    state.notify({ type: MESSAGES.PAUSE });
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
      controlsEl.style.display = "flex";
    }
  }
});

state.subscribe((msg) => {
  if (msg.type == MESSAGES.NEW_TURING_STATE) {
    turingMachineStateEl.innerHTML = msg.value;
  }
});

// -

const main = () => {
  let turingMachine;
  const startString = urlParams.get("start");

  state.subscribe((msg) => {
    if (msg.type == MESSAGES.SET_CELL) {
      const { value, cell } = msg;
      if (turingMachine) turingMachine.setTapeAtCell(cell, value);
    }
    if (msg.type == MESSAGES.COMPILE) {
      const { value } = msg;
      try {
        const beginState = "q0";
        const acceptState = "f";
        const tape = Array(TAPE_LEN)
          .fill(BLANK_VAL)
          .map((x, i) =>
            startString && i < startString.length ? startString[i] : x
          );

        // put the cells into the tape
        const cells = tape.map((_, cellId) => cell(cellId, tape[cellId]));
        tapeEl.innerHTML = "";
        for (const cell of cells) {
          tapeEl.appendChild(cell);
        }

        const rules = parseRules(value, beginState, acceptState);
        turingMachine = new TuringMachine(tape, rules, beginState, acceptState);

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
      }, SIMULATION_INTERVAL);
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
            : `<span class='error'>Fail(${status})</span>`,
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
