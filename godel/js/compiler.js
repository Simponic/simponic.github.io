class StringBuilder {
  constructor() {
    this.stringPieces = [];
  }
  add(s) {
    this.stringPieces.push(s);
  }
  build() {
    return this.stringPieces.join("");
  }
}

const compileGoto = (gotoNode, stringBuilder) => {
  stringBuilder.add(`this.followGoto("${gotoNode.label}");\nreturn;\n`);
};

const compileConditional = (conditionalNode, stringBuilder) => {
  const { variable, goto: gotoNode } = conditionalNode;

  stringBuilder.add(`if (this.get("${variable}") != 0) {\n`);
  compileGoto(gotoNode, stringBuilder);
  stringBuilder.add(`}\n`);
};

const compileAssignment = (assignmentNode, stringBuilder) => {
  const { variable, expr } = assignmentNode;
  if (expr.opr) {
    if (expr.opr == "+") stringBuilder.add(`this.addOne("${variable}");\n`);
    else if (expr.opr == "-")
      stringBuilder.add(`this.subtractOne("${variable}");\n`);
  } else {
    stringBuilder.add("// noop \n");
  }
};

const compileInstruction = (instruction, stringBuilder) => {
  if (instruction.goto) {
    compileGoto(instruction.goto, stringBuilder);
    return; // ignore unreachable addition to instructionPointer
  }

  if (instruction.conditional) {
    compileConditional(instruction.conditional, stringBuilder);
  } else if (instruction.assignment) {
    compileAssignment(instruction.assignment, stringBuilder);
  }

  stringBuilder.add("this.instructionPointer++;\n");
};

const compile = (ast) => {
  const stringBuilder = new StringBuilder();
  stringBuilder.add(`
    class Program {
      constructor() {
        this.variables = new Map(); // variable -> natural number val
        this.labelInstructions = new Map(); // labels to instruction indices
        this.instructions = new Map(); // instruction indices to procedures

        this.instructions.set(0, () => this.main());
        this.instructionPointer = 0;
        this.variables.set("Y", 0);

        // -- program-specific state init --
        this.finalInstruction = ${
          ast.instructions.length + 1
        }; // instruction of the implied "exit" label
        // "E" is the exit label
        this.labelInstructions.set("E", this.finalInstruction); 
      }

      get(variable) {
        if (!this.variables.has(variable)) {
          this.variables.set(variable, 0);
        }
        return this.variables.get(variable);
      }

      addOne(variable) {
        const val = this.get(variable);
        this.variables.set(variable, val + 1);
      }

      subtractOne(variable) {
        const val = this.get(variable);
        this.variables.set(variable, val - 1);
      }

      followGoto(label) {
        this.instructionPointer = this.labelInstructions.get(label);
      }

      step() {
        if (!this.isCompleted()) {
          const procedure = this.instructions.get(this.instructionPointer);
          procedure();
 
        }
        return this.instructionPointer;
      }

      isCompleted() {
        return this.instructionPointer == this.finalInstruction;
      }

      getResult() {
        return this.variables.get("Y");
      }

      run(maxIter=500_000) {
        let iter = 0;
        while (!this.isCompleted() && (++iter) < maxIter) this.step();
        if (iter < maxIter) {
          return this.getResult();
        }
        throw new Error("Too many iterations. To resolve, please ask"
           + " Turing how we can find if a program will halt during compilation.");
      }

      main() {
`);

  stringBuilder.add("// -- build label -> instruction map --\n");
  for (let i = 0; i < ast.instructions.length; i++) {
    const line = ast.instructions[i];
    const instructionIdx = i + 1;
    if (line.label) {
      stringBuilder.add(
        `this.instructions.set(${instructionIdx}, () => this.${line.label}());\n`
      );
      stringBuilder.add(
        `this.labelInstructions.set("${line.label}", ${instructionIdx});\n`
      );
    }
  }

  stringBuilder.add("// -- compiled instructions --\n");
  for (let i = 0; i < ast.instructions.length; i++) {
    let instruction = ast.instructions[i];
    const instructionIdx = i + 1;
    if (instruction.label) {
      stringBuilder.add(
        `  this.followGoto("${instruction.label}");\n}\n\n${instruction.label}() {\n`
      );
      stringBuilder.add(`this.instructionPointer = ${instructionIdx};\n`);
      instruction = instruction.instruction;
    }

    compileInstruction(instruction, stringBuilder);
  }

  stringBuilder.add(`  }\n}\n`);
  stringBuilder.add("// -- \n");
  stringBuilder.add("const program = new Program();\n\n");
  stringBuilder.add("// set the initial Snapshot here\n");
  stringBuilder.add('// program.variables.set("X1", 2);\n\n');
  stringBuilder.add("program.run();\n");
  stringBuilder.add("console.log(program.variables);\n");
  stringBuilder.add("program.getResult();\n");

  return js_beautify(stringBuilder.build(), {
    indent_size: 2,
    wrap_line_length: 100,
  });
};
