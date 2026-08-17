import OpenAI from "openai";
import * as fs from 'fs';
import { execSync } from "child_process";

type ToolMessage = {
  role: "tool",
  tool_call_id: string,
  content: string
}

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  let messages = [{ role: "user", content: prompt }];

  while (true) {
    const response = await client.chat.completions.create({
      model: "anthropic/claude-haiku-4.5",
      messages: messages,
      tools: [{
        type: "function",
        function: {
          name: "Read",
          description: "Read and return the contents of a file",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "The path to the file to read"
              }
            },
            required: ["file_path"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "Write",
          description: "Write to a file and return the contents of the file",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "The path to the file to write to"
              },
              content: {
                type: "string",
                description: "The content to write to the file"
              }
            },
            required: ["file_path", "content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "Bash",
          description: "Execute a shell command",
          parameters: {
            type: "object",
            required: ["command"],
            properties: {
              command: {
                type: "string",
                description: "The command to execute"
              }
            }
          }
        }
      }]
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }
    if (response.choices[0].message) {
      messages.push(response.choices[0].message);
    }
    if (
      !response.choices[0].message.tool_calls ||
      response.choices[0].message.tool_calls.length === 0
    ) {
      console.log(response.choices[0].message.content);
      return;
    }

    for (let toolCall of response.choices[0].message.tool_calls) {
      let args = JSON.parse(toolCall.function.arguments);
      const fileName = args.file_path;
      let contents = "";

      if (toolCall.function.name === "Read") {
        contents = fs.readFileSync(fileName, "utf8");
      } else if (toolCall.function.name === "Write") {
        fs.writeFileSync(fileName, args.content, "utf8");
        contents = "File written successfully";
      } else if (toolCall.function.name === "Bash") {
        contents = execSync(args.command, {
            encoding: "utf8",
        });
      } else {
        contents = `Unknown tool: ${toolCall.function.name}`;
      }
      const messageObject: ToolMessage = {
        role: "tool",
        tool_call_id: toolCall.id,
        content: contents,
      };
      messages.push(messageObject);
    }
  }
}
main();
