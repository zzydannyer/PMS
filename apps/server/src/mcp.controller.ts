import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";

import { AuthService } from "./auth.service.js";
import { DatabaseService } from "./database.service.js";
import { ProposalService } from "./proposal.service.js";

type McpParams = {
  workspaceId: string;
  projectId: string;
  query: string;
  message: string;
};

type McpRequest = {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params: McpParams;
};

type McpResponse = {
  jsonrpc: "2.0";
  id: string;
  result: {
    [key: string]: string | string[] | object[];
  };
};

@Controller("api/mcp")
export class McpController {
  public constructor(
    private readonly authService: AuthService,
    private readonly databaseService: DatabaseService,
    private readonly proposalService: ProposalService,
  ) {}

  @Post()
  async handle(
    @Body() request: McpRequest,
    @Headers("authorization") authorization: string,
  ): Promise<McpResponse> {
    const memberId = this.resolveMemberId(authorization);
    if (request.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2025-06-18",
          serverName: "pms-agent",
          capabilities: ["tools"],
        },
      };
    }
    if (request.method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: [
            "search_workspace",
            "create_work_item_proposal",
          ],
        },
      };
    }
    if (request.method === "tools/call") {
      await this.databaseService.assertMemberCanRead(
        request.params.workspaceId,
        memberId,
      );
      if (request.params.query !== "") {
        const results = await this.databaseService.search(
          request.params.workspaceId,
          request.params.query,
        );
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: results.map((result) => result.title),
          },
        };
      }
      const proposal = await this.proposalService.create({
        workspaceId: request.params.workspaceId,
        projectId: request.params.projectId,
        requesterId: memberId,
        message: request.params.message,
      });
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          proposalId: proposal.id,
          status: proposal.status,
        },
      };
    }
    throw new UnauthorizedException("不支持的 MCP 方法");
  }

  private resolveMemberId(authorization: string): string {
    if ((authorization || "") === "") {
      throw new UnauthorizedException("需要登录");
    }
    return this.authService.resolveMemberId(authorization);
  }
}
