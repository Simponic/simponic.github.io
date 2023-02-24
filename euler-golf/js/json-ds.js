class JSONSet {
  items = new Set();

  constructor(initial) {
    if (Array.isArray(initial)) {
      initial.map((x) => this.apply_set_function("add", x));
    } else {
      this.apply_set_function("add", initial);
    }

    ["add", "has", "remove"].forEach(
      (f_name) => (this[f_name] = (x) => this.apply_set_function(f_name, x))
    );
  }

  apply_set_function(f_name, x) {
    return this.items[f_name](JSON.stringify(x));
  }
}
