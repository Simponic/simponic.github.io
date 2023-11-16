class TuringMachine {
  constructor(tape = [], rules = [], initialState = "q0", acceptState = "f") {
    this.tape = tape;
    this.rules = this.parseRules(rules);
    this.state = initialState;
    this.head = 0;
    this.acceptState = acceptState;

    this.iteration = 0;
  }

  getStateStatus() {
    return `State: ${this.state}, Step: ${this.iteration}`;
  }

  getHead() {
    return this.head;
  }

  getState() {
    return this.state;
  }

  getTapeAtCell(idx) {
    return this.tape[idx];
  }

  setTapeAtCell(idx, val) {
    this.tape[idx] = val;
  }

  isAccepting() {
    return this.state == this.acceptState;
  }

  parseRules(rules) {
    const parsedRules = {};
    for (const [currentState, readSymbol, action, newState] of rules) {
      const key = `${currentState},${readSymbol}`;
      const value = `${newState},${action}`;
      parsedRules[key] = value;
    }
    return parsedRules;
  }

  step() {
    const currentSymbol = this.tape[this.head];
    const key = `${this.state},${currentSymbol}`;
    if (!(key in this.rules)) {
      return false;
    }
    const rule = this.rules[key];
    const [newState, action] = rule.split(",");

    this.state = newState;
    this.iteration++;

    if (action === "R") {
      this.head += 1;
    } else if (action === "L") {
      this.head -= 1;
    } else {
      this.tape[this.head] = action;
    }

    if (this.isAccepting()) {
      return false;
    }

    return this.head >= 0 && this.head < this.tape.length;
  }
}
