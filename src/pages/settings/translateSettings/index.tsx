/**
 * 翻译设置页面
 * 配置自定义翻译 API
 */

import { ProForm, ProFormText, ProFormTextArea, ProFormSelect } from "@ant-design/pro-components";
import { Button, Card, message, Space, Typography } from "antd";
import { useState, useEffect } from "react";
import { testApiConnection, type TranslateApiConfig } from "@/services/customApiService";

const { Title, Text } = Typography;

// 使用 localStorage 保存配置
const STORAGE_KEY = "translate_api_config";

const defaultConfig: TranslateApiConfig = {
    apiBase: "",
    apiKey: "",
    modelName: "",
    targetLanguage: "英语",
    prompt: "",
};

const languageOptions = [
    { label: "英语", value: "英语" },
    { label: "中文", value: "中文" },
    { label: "日语", value: "日语" },
    { label: "韩语", value: "韩语" },
    { label: "法语", value: "法语" },
    { label: "德语", value: "德语" },
    { label: "西班牙语", value: "西班牙语" },
    { label: "俄语", value: "俄语" },
];

export function getTranslateConfig(): TranslateApiConfig {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return { ...defaultConfig, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error("Failed to load translate config:", e);
    }
    return defaultConfig;
}

export function saveTranslateConfig(config: TranslateApiConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function TranslateSettings() {
    const [config, setConfig] = useState<TranslateApiConfig>(defaultConfig);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        setConfig(getTranslateConfig());
    }, []);

    const handleSave = (values: TranslateApiConfig) => {
        saveTranslateConfig(values);
        setConfig(values);
        message.success("翻译设置已保存");
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
            <Title level={4}>翻译设置</Title>
            <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>
                配置用于翻译的大模型 API（兼容 OpenAI 格式）
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
                    placeholder="例如: gpt-4o、deepseek-v3 等"
                    rules={[{ required: true, message: "请输入模型名称" }]}
                />

                <ProFormSelect
                    name="targetLanguage"
                    label="目标语言"
                    options={languageOptions}
                    rules={[{ required: true, message: "请选择目标语言" }]}
                    tooltip="翻译的目标语言"
                />

                <ProFormTextArea
                    name="prompt"
                    label="翻译提示词（可选）"
                    placeholder="自定义翻译的提示词，留空使用默认提示词"
                    fieldProps={{
                        rows: 3,
                    }}
                    tooltip="可选，自定义发送给模型的提示词"
                />
            </ProForm>
        </Card>
    );
}
