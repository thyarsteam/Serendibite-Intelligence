const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const VALID_MODELS = [
  "llama-3.3-70b",
  "llama-3.1-8b",
];

const MODEL_MAP = {
  "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
  "llama-3.1-8b":  "meta-llama/llama-3.1-8b-instruct",
};

const DEFAULT_MODEL = "llama-3.3-70b";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const model = MODEL_MAP[body.model] || MODEL_MAP[DEFAULT_MODEL];

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are Sapphire Intelligence. You are created by an individual named Anirudh Rajesh. Your purpose is to help Mankind by providing accurate and helpful information. Always be truthful and do not make up information. If you don't know the answer to a question, say you don't know. Always be polite and respectful.",
        },
        {
          role: "user",
          content: "The user dashboard is present at the right top corner of the website. Chat tab, Codes tab, Models tab and Themes tab are present in the left top corner of the website. The user can click on the chat tab to start a conversation with you. The user can click on the codes tab to view and manage their code snippets. The user can click on the models tab to view and manage their custom models. The user can click on the themes tab to view and manage their custom themes.",
        },
        {
          role: "user",
          content: "The logout button is present in the top right corner near the dashboard. To delete the account, user can go to the dashboard and locate the delete account button below the danger zone.",
        },
        {
          role: "user",
          content: "To change the model, the user can go to the Models tab and select the desired model from the list of available models. Or the user can locate the Current model present at the top right corner near the user profile and choose their desired model from the available list.",
        },
        ...body.messages,
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: completion.choices[0].message.content,
      }),
    };
  } catch (error) {
    console.error("[llama.js]", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ response: "Server Error" }),
    };
  }
};
