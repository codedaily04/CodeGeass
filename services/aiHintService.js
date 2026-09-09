const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const generateHint = async (problem, userCode, language) => {
    const prompt = `
You are a competitive programming mentor.

Your job is to help a user solve a coding problem without giving them the solution.

PROBLEM:
Title: ${problem.title}

Difficulty: ${problem.difficulty}

Description:
${problem.description}

USER'S CURRENT CODE:
Language: ${language}

${userCode}

Give the user ONE useful hint based specifically on their current code.

Rules:
1. Do NOT provide code.
2. Do NOT give the complete solution.
3. Do NOT directly reveal the final algorithm.
4. Identify a mistake, missing observation, or useful direction.
5. The hint should be specific to the user's current approach.
6. Keep the hint concise, around 2-4 sentences.
7. If the code is empty, give a conceptual hint for the problem.
`;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.3,
        max_tokens: 150,
    });

    return completion.choices[0].message.content;
};

module.exports = {
    generateHint,
};