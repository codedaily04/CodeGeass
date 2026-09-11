const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const playgroundPath = path.join(__dirname, "../playground");

if (!fs.existsSync(playgroundPath)) {
  fs.mkdirSync(playgroundPath, { recursive: true });
}

const EXECUTION_TIMEOUT = 5000; // 5 seconds for execution

const executePy = (filepath, inputData) => {
  return new Promise((resolve, reject) => {
    // Execute Python script with input via stdin (no shell) with timeout
    const execProcess = execFile("python3", [filepath], { timeout: EXECUTION_TIMEOUT }, (error, stdout, stderr) => {
      // Cleanup source file after execution (success or failure)
      fs.unlink(filepath, () => {});
      
      if (error) {
        // Check if it was a timeout
        if (error.killed && error.signal === 'SIGTERM') {
          return reject({ 
            status: "timeout", 
            message: "Execution timed out" 
          });
        }
        return reject({ error, stderr });
      }

      if (stderr) {
        return reject(stderr);
      }

      resolve(stdout);
    });

    // Write input data to stdin (no shell interpolation)
    if (inputData) {
      execProcess.stdin.write(inputData);
    }
    execProcess.stdin.end();
  });
};

module.exports = executePy