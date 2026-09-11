const executeCpp = require("../../compiler/executeCpp");
const executePy = require("../../compiler/executePy");
const generateFile = require("../../compiler/generateFile");

const MAX_CODE_SIZE = 50000; // 50KB max code size

const runCodeController = async (req, res) => {
    try {
        const { lang, code, input } = req.body;

        if (!code) {
            res.status(400).json({ "message": "Empty Code Body" });
            return;
        }

        // Validate code size
        if (code.length > MAX_CODE_SIZE) {
            return res.status(400).json({ 
                "message": `Code size exceeds maximum allowed (${MAX_CODE_SIZE} characters)` 
            });
        }

        const filePath = await generateFile(lang, code);

        console.log(input);

        if (lang === "cpp") {
            const output = await executeCpp(filePath, input);
            return res.status(200).json(output);
        }

        if(lang == "py") {
            const output = await executePy(filePath, input);
            return res.status(200).json(output);
        }

        return res.status(200).json("failed");
    } catch (err) {
        res.status(500).json(err);
    }
}

module.exports = runCodeController;