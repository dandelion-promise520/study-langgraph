import { tool } from "@langchain/core/tools";
import * as z from "zod";

export const addTool = tool(({ a, b }) => `${a + b}`, {
  name: "add",
  description: "两个数相加",
  schema: z.object({
    a: z.number().describe("第一个数字"),
    b: z.number().describe("第二个数字"),
  }),
});

export const multiplyTool = tool(({ a, b }) => `${a * b}`, {
  name: "multiply",
  description: "两个数相乘",
  schema: z.object({
    a: z.number().describe("第一个数字"),
    b: z.number().describe("第二个数字"),
  }),
});

export const divideTool = tool(({ a, b }) => `${a / b}`, {
  name: "divide",
  description: "两个数相除",
  schema: z.object({
    a: z.number().describe("第一个数字"),
    b: z.number().describe("第二个数字"),
  }),
});

export const mathTools = [addTool, multiplyTool, divideTool];

export const toolsByName: Record<string, (typeof mathTools)[number]> = {
  [addTool.name]: addTool,
  [multiplyTool.name]: multiplyTool,
  [divideTool.name]: divideTool,
};
