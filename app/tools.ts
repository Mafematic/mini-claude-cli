import * as fs from 'fs';
import { execSync } from "child_process";
import type { ChatCompletionMessageToolCall, ChatCompletionMessageParam } from "openai/resources/chat/completions";

type ToolMessage = {
    role: "tool",
    tool_call_id: string,
    content: string
}

type ReadArgs = {
    file_path: string;
  };
  
  type WriteArgs = {
    file_path: string;
    content: string;
  };
  
  type BashArgs = {
    command: string;
  };

export function executeTools(toolCalls: ChatCompletionMessageToolCall[], messages: ChatCompletionMessageParam[]) {
    for (let toolCall of toolCalls) {
        let args = JSON.parse(toolCall.function.arguments);
        let contents = "";
        if (toolCall.function.name === "Read") {
          contents = executeRead(args);
        } else if (toolCall.function.name === "Write") {
          contents = executeWrite(args);
        } else if (toolCall.function.name === "Bash") {
          contents = executeBash(args);
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

function executeRead(args: ReadArgs) {
    return fs.readFileSync(args.file_path, "utf8");
}

function executeWrite(args: WriteArgs) {
    fs.writeFileSync(args.file_path, args.content, "utf8");
    return "File written successfully";
}

function executeBash(args: BashArgs) {
    return execSync(args.command, {
        encoding: "utf8",
    });
}