const MESSAGES = {
  COMPILE: "COMPILE",
  COMPILE_RESULT: "COMPILE_RESULT",
  EVAL: "EVAL",
  EVAL_STATUS: "EVAL_RESULT",
};

// -- the "real" code --

const state = new Observable();

const prepareSource = (text) => text.replaceAll(/\/\/.*/g, "").trim();

const main = () => {
  let program;

  state.subscribe((msg) => {
    if (msg.type == MESSAGES.COMPILE) {
      const { value } = msg;
      const source = prepareSource(value);
      try {
        const ast = parser.parse(source);
        const program = compile(ast);

        state.notify({
          type: MESSAGES.COMPILE_RESULT,
          value: program,
        });
      } catch (e) {
        state.notify({
          type: MESSAGES.COMPILE_RESULT,
          error: e.toString(),
        });
      }
    }
    if (msg.type == MESSAGES.EVAL) {
      const source = compiledEditorEl.getValue();
      try {
        const result = eval(source);
        state.notify({
          type: MESSAGES.EVAL_RESULT,
          value: result,
        });
      } catch (e) {
        state.notify({
          type: MESSAGES.EVAL_RESULT,
          error: e.toString(),
        });
      }
    }
  });
};
main();

// -- a bit of some hacky ui code --

const instructionsEl = document.getElementById("instructions");
const instructionsEditorEl = CodeMirror.fromTextArea(instructionsEl, {
  lineNumbers: true,
});

const compileButton = document.getElementById("compile");
const evalButton = document.getElementById("eval");
const evalStatusEl = document.getElementById("eval_status");
const compileStatusEl = document.getElementById("compile_status");
const compiledEl = document.getElementById("compiled");
const compiledEditorEl = CodeMirror.fromTextArea(compiledEl, {
  lineNumbers: true,
});
state.subscribe((msg) => {
  if (msg.type == MESSAGES.COMPILE_RESULT) {
    evalStatusEl.classList.remove("error");
    evalStatusEl.classList.remove("success");
    evalStatusEl.innerHTML = "";

    if (typeof msg.value !== "undefined") {
      compiledEditorEl.setValue(msg.value);

      compileStatusEl.classList.add("success");
      compileStatusEl.classList.remove("error");
      compileStatusEl.innerHTML = `Successful compile at ${new Date().toLocaleString()}!`;
    } else if (msg.error) {
      compiledEditorEl.setValue("");

      compileStatusEl.classList.remove("success");
      compileStatusEl.classList.add("error");
      compileStatusEl.innerHTML = msg.error;
    }
  }
});
state.subscribe((msg) => {
  if (msg.type == MESSAGES.EVAL_RESULT) {
    if (typeof msg.value !== "undefined") {
      evalStatusEl.classList.add("success");
      evalStatusEl.classList.remove("error");
      evalStatusEl.innerHTML = `Result: ${msg.value}`;
    } else if (msg.error) {
      evalStatusEl.classList.remove("success");
      evalStatusEl.classList.add("error");
      evalStatusEl.innerHTML = msg.error;
    }
  }
});

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("instructions")) {
  editorEl.setValue(atob(urlParams.get("instructions")));
}

compileButton.addEventListener("click", () => {
  state.notify({
    type: MESSAGES.COMPILE,
    value: instructionsEditorEl.getValue(),
  });
});

evalButton.addEventListener("click", () => {
  state.notify({
    type: MESSAGES.EVAL,
  });
});
