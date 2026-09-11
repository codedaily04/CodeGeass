const Problem = require("../../models/problem");

const getProblemController = async (req, res) => {
    try {
        let slug = req.params.slug;
        
        // Exclude input and output fields from public API
        // These are test cases and should only be accessible to the judge
        const problem = await Problem.findOne({slug}).select('-input -output');
        
        if(!problem) {
            return res.status(400).json({message: "No Problem Found"});
        }
        res.status(200).json(problem);
    } catch(error) {
        console.log(error);
        res.status(500).json(error);
    }
}

module.exports = getProblemController;