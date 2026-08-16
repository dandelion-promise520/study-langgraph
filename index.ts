import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const model = new ChatOpenAI({
    configuration: {
        baseURL: " http://127.0.0.1:8045/v1",
    },
    apiKey: " sk-9ad190d5bace4ac19b0a108b428ac460 ",
    model: " gemini-3.7-flash-high ",
});

// Define tools
const add = tool(({ a, b }) => a + b, {
    name: "add",
    description: "Add two numbers",
    schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
    }),
});

const multiply = tool(({ a, b }) => a * b, {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
    }),
});

const divide = tool(({ a, b }) => a / b, {
    name: "divide",
    description: "Divide two numbers",
    schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
    }),
});

// Augment the LLM with tools
const toolsByName = {
    [add.name]: add,
    [multiply.name]: multiply,
    [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);