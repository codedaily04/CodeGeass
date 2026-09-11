const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const playgroundPath = path.join(__dirname, "../playground");

if (!fs.existsSync(playgroundPath)) {
  fs.mkdirSync(playgroundPath, { recursive: true });
}

const EXECUTION_TIMEOUT = 10000; // 10 seconds for judge execution

const executePy = (filepath, inputPath) => {
  return new Promise((resolve, reject) => {
    // Read input file
    fs.readFile(inputPath, "utf8", (readError, inputData) => {
      if (readError) {
        // Cleanup on read error
        fs.unlink(filepath, () => {});
        return reject({ error: readError, stderr: "Failed to read input file" });
      }

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
  });
};

module.exports = executePy