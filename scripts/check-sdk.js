const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: "dummy" });
console.log("has completions:", !!openai.completions);
console.log("has chat:", !!openai.chat);
console.log("has beta:", !!openai.beta);
console.log("has responses:", !!openai.responses);
process.exit(0);
