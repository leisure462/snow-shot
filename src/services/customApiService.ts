/**
 * 自定义 OCR 和翻译 API 服务
 * 通过调用用户配置的视觉大模型 API 实现 OCR 和翻译功能
 */

import { fetch } from "@tauri-apps/plugin-http";

export interface ApiConfig {
  apiBase: string;
  apiKey: string;
  modelName: string;
  prompt?: string;
}

export interface OcrApiConfig extends ApiConfig {
  prompt?: string;
}

export interface TranslateApiConfig extends ApiConfig {
  targetLanguage: string;
  prompt?: string;
}

/**
 * 调用视觉大模型进行 OCR 识别
 * @param imageBase64 图片的 base64 编码
 * @param config OCR API 配置
 * @returns OCR 识别结果文本
 */
export async function callOcrApi(
  imageBase64: string,
  config: OcrApiConfig
): Promise<string> {
  const defaultPrompt =
    config.prompt ||
    "请识别图片中的所有文字内容，直接返回识别到的文字，不要添加任何解释或格式化。";

  const requestBody = {
    model: config.modelName,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: defaultPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  };

  const response = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OCR API 调用失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
}

/**
 * 调用大模型进行翻译
 * @param text 需要翻译的文本
 * @param config 翻译 API 配置
 * @returns 翻译结果
 */
export async function callTranslateApi(
  text: string,
  config: TranslateApiConfig
): Promise<string> {
  const defaultPrompt =
    config.prompt ||
    `请将以下文本翻译成${config.targetLanguage}，直接返回翻译结果，不要添加任何解释：`;

  const requestBody = {
    model: config.modelName,
    messages: [
      {
        role: "user",
        content: `${defaultPrompt}\n\n${text}`,
      },
    ],
    max_tokens: 4096,
  };

  const response = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`翻译 API 调用失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
}

/**
 * 测试 API 连接
 * @param config API 配置
 * @returns 测试结果
 */
export async function testApiConnection(
  config: ApiConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const requestBody = {
      model: config.modelName,
      messages: [
        {
          role: "user",
          content: "Hello, please respond with 'OK' if you can receive this message.",
        },
      ],
      max_tokens: 10,
    };

    const response = await fetch(`${config.apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `API 响应错误: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();
    if (result.choices && result.choices.length > 0) {
      return {
        success: true,
        message: "API 连接成功！",
      };
    }

    return {
      success: false,
      message: "API 响应格式异常",
    };
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
