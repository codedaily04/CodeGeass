const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const playgroundPath = path.join(__dirname, "../playground");

if (!fs.existsSync(playgroundPath)) {
  fs.mkdirSync(playgroundPath, { recursive: true });
}

const COMPILE_TIMEOUT = 10000; // 10 seconds for compilation
const EXECUTION_TIMEOUT = 5000; // 5 seconds for execution

const executeCpp = (filepath, inputData) => {
  const jobId = path.basename(filepath).split(".")[0];
  const outPath = path.join(playgroundPath, `${jobId}.out`);

  return new Promise((resolve, reject) => {
    // Step 1: Compile C++ code using execFile (no shell) with timeout
    execFile("g++", [filepath, "-o", outPath], { timeout: COMPILE_TIMEOUT }, (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        // Cleanup source file on compilation failure
        fs.unlink(filepath, () => {});
        
        // Check if it was a timeout
        if (compileError.killed && compileError.signal === 'SIGTERM') {
          return reject({ 
            status: "timeout", 
            message: "Compilation timed out" 
          });
        }
        return reject({ error: compileError, stderr: compileStderr });
      }

      if (compileStderr) {
        // Cleanup on compilation error
        fs.unlink(filepath, () => {});
        fs.unlink(outPath, () => {});
        return reject(compileStderr);
      }

      // Step 2: Execute compiled binary with input via stdin and timeout
      const execProcess = execFile(outPath, [], { timeout: EXECUTION_TIMEOUT }, (execError, execStdout, execStderr) => {
        // Cleanup source file and binary after execution (success or failure)
        fs.unlink(filepath, () => {});
        fs.unlink(outPath, () => {});
        
        if (execError) {
          // Check if it was a timeout
          if (execError.killed && execError.signal === 'SIGTERM') {
            return reject({ 
              status: "timeout", 
              message: "Execution timed out" 
            });
          }
          return reject({ error: execError, stderr: execStderr });
        }

        if (execStderr) {
          return reject(execStderr);
        }

        resolve(execStdout);
      });

      // Write input data to stdin (no shell interpolation)
      if (inputData) {
        execProcess.stdin.write(inputData);
      }
      execProcess.stdin.end();
    });
  });
};

module.exports = executeCpp