import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// 1. Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 2. Initialize MCP Server
const server = new Server(
  {
    name: "FounderRank-MCP",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 3. Define Available Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_top_founders",
        description: "Retrieves the highest scored startup founders from the FounderRank triage database.",
        inputSchema: {
          type: "object",
          properties: {
            minScore: {
              type: "number",
              description: "Minimum AI match score (0-100) to filter by. Usually 80 for 'Must Meet'.",
            },
            limit: {
              type: "number",
              description: "Maximum number of founders to return. Default is 5.",
            },
          },
          required: ["minScore"],
        },
      },
    ],
  };
});

// 4. Handle Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_top_founders") {
    const minScore = Number(request.params.arguments?.minScore) || 80;
    const limit = Number(request.params.arguments?.limit) || 5;

    const { data, error } = await supabase
      .from("profiles")
      .select("namn, company_name, stage, score, verdict, reasoning, linkedin_url")
      .gte("score", minScore)
      .neq("status", "declined")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  throw new Error("Tool not found");
});

// 5. Connect the STDIO Transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FounderRank MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});