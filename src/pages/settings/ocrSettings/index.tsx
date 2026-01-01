/**
 * OCR 设置页面
 * 配置自定义 OCR API
 */

import { ProForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Button, Card, message, Space, Typography } from "antd";
import { useState, useEffect } from "react";
import { testApiConnection, type OcrApiConfig } from "@/services/customApiService";

const { Title, Text } = Typography;

// 使用 localStorage 保存配置
const STORAGE_KEY = "ocr_api_config";

const defaultConfig: OcrApiConfig = {
    apiBase: "",
    apiKey: "",
    modelName: "",
    prompt: "请识别图片中的所有文字内容，直接返回识别到的文字，不要添加任何解释或格式化。",
};

export function getOcrConfig(): OcrApiConfig {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return { ...defaultConfig, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error("Failed to load OCR config:", e);
    }
    return defaultConfig;
}

export function saveOcrConfig(config: OcrApiConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function OcrSettings() {
    const [config, setConfig] = useState<OcrApiConfig>(defaultConfig);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        setConfig(getOcrConfig());
    }, []);

    const handleSave = (values: OcrApiConfig) => {
        saveOcrConfig(values);
        setConfig(values);
        message.success("OCR 设置已保存");
    };

    const handleTest = async () => {
        if (!config.apiBase || !config.apiKey || !config.modelName) {
            message.warning("请先填写完整的 API 配置");
            return;
        }

        setTesting(true);
        try {
            const result = await testApiConnection(config);
            if (result.success) {
                message.success(result.message);
            } else {
                message.error(result.message);
            }
        } catch (error) {
            message.error(`测试失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setTesting(false);
        }
    };

    return (
        <Card>
            <Title level={4}>OCR 识别设置</Title>
            <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>
                配置用于 OCR 文字识别的视觉大模型 API（兼容 OpenAI 格式）
            </Text>

            <ProForm
                initialValues={config}
                onFinish={handleSave}
                submitter={{
                    render: (props, doms) => {
                        return (
                            <Space>
                                {doms}
                                <Button onClick={handleTest} loading={testing}>
                                    测试连接
                                </Button>
                            </Space>
                        );
                    },
                }}
            >
                <ProFormText
                    name="apiBase"
                    label="API Base URL"
                    placeholder="例如: https://api.openai.com/v1"
                    rules={[{ required: true, message: "请输入 API Base URL" }]}
                    tooltip="API 的基础地址，不包含 /chat/completions 后缀"
                />

                <ProFormText.Password
                    name="apiKey"
                    label="API Key"
                    placeholder="输入您的 API Key"
                    rules={[{ required: true, message: "请输入 API Key" }]}
                />

                <ProFormText
                    name="modelName"
                    label="模型名称"
                    placeholder="例如: gpt-4o、glm-4v 等"
                    rules={[{ required: true, message: "请输入模型名称" }]}
                    tooltip="支持视觉功能的模型，如 GPT-4o、GLM-4V 等"
                />

                <ProFormTextArea
                    name="prompt"
                    label="OCR 提示词"
                    placeholder="自定义 OCR 识别的提示词"
                    fieldProps={{
                        rows: 3,
                    }}
                    tooltip="可选，自定义发送给模型的提示词"
                />
            </ProForm>
        </Card>
    );
}
