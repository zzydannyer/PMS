import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type OpenRouterMessage = {
  role: "user";
  content: string;
};

type OpenRouterRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature: number;
};

type OpenRouterChoice = {
  message: {
    content: string;
  };
};

type OpenRouterResponse = {
  choices: OpenRouterChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
};

export type AiGatewayResult = {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
};

@Injectable()
export class AiGatewayService {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fallbackModels: string[];
  private readonly apiKey: string;

  public constructor(configService: ConfigService) {
    this.baseUrl = configService.get<string>(
      "OPENROUTER_BASE_URL",
      "https://openrouter.ai/api/v1",
    );
    this.model = configService.get<string>("OPENROUTER_MODEL", "");
    this.fallbackModels = configService
      .get<string>("OPENROUTER_FALLBACK_MODELS", "")
      .split(",")
      .map((model) => model.trim())
      .filter((model) => model !== "");
    this.apiKey = configService.get<string>("OPENROUTER_API_KEY", "");
  }

  async ask(message: string): Promise<AiGatewayResult> {
    if (this.apiKey === "" || this.model === "") {
      throw new ServiceUnavailableException("AI 模型尚未配置");
    }
    for (const model of [this.model, ...this.fallbackModels]) {
      const request: OpenRouterRequest = {
        model,
        messages: [{ role: "user", content: message }],
        temperature: 0.2,
      };
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        continue;
      }
      const payload = (await response.json()) as OpenRouterResponse;
      const choice = payload.choices[0];
      if (choice && choice.message.content.trim() !== "") {
        return {
          content: choice.message.content,
          model,
          promptTokens: payload.usage.prompt_tokens,
          completionTokens: payload.usage.completion_tokens,
        };
      }
    }
    throw new ServiceUnavailableException("AI 服务暂时不可用");
  }
}
