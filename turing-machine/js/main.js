const DISPLAY_CELLS = 15;
const TAPE_LEN = 200;

const MESSAGES = {
  SET_CELL: "SET_CELL",
  PAUSE: "PAUSE",
  SIMULATE: "SIMULATE",
  SET_READER: "SET_READER",
};

class Observable {
  constructor() {
    this.observers = [];
  }

  subscribe(f) {
    this.observers.push(f);
  }

  unsubscribe(f) {
    this.observers = this.observers.filter((subscriber) => subscriber !== f);
  }

  notify(data) {
    this.observers.forEach((observer) => observer(data));
  }
}

const state = new Observable();

const tape = Array(TAPE_LEN).fill(0);
state.subscribe((msg) => {
  if (msg.type == MESSAGES.SET_CELL) {
    tape[msg.cellId] = msg.value;
  }
});

const tapeEl = document.getElementById("tape");

const inputCellId = (cellId) => `${cellId}-input`;
const updateCellButtonId = (cellId) => `${cellId}-button-update`;

const setCellFromInput = (cellId, inputId) => {
  const input = document.getElementById(inputId);
  tape[cellId] = input.value;
};

const cell = (cellId, initValue = 0) => {
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

const main = () => {
  const cells = tape.map((_, cellId) => cell(cellId));
  for (const cell of cells) {
    tapeEl.appendChild(cell);
  }
  state.notify({ type: MESSAGES.SET_READER, cell: 0 });

  setTimeout(() => {}, 1000);
};

main();
