/**
 * OCR 结果展示窗口
 * 显示截图和 OCR 识别结果，提供翻译功能
 */

import { useState, useEffect, useCallback } from "react";
import { Button, Card, Typography, Space, Spin, message, Divider, Tooltip } from "antd";
import { CopyOutlined, TranslationOutlined, ReloadOutlined, SoundOutlined } from "@ant-design/icons";
import { callOcrApi, callTranslateApi } from "@/services/customApiService";
import { getOcrConfig } from "@/pages/settings/ocrSettings";
import { getTranslateConfig } from "@/pages/settings/translateSettings";

import styled from "styled-jsx/css";

const { Text, Paragraph } = Typography;

interface OcrResultWindowProps {
    imageBase64: string;
    onClose?: () => void;
}

export default function OcrResultWindow({ imageBase64, onClose }: OcrResultWindowProps) {
    const [ocrText, setOcrText] = useState<string>("");
    const [translatedText, setTranslatedText] = useState<string>("");
    const [ocrLoading, setOcrLoading] = useState(false);
    const [translateLoading, setTranslateLoading] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);

    // 执行 OCR 识别
    const performOcr = useCallback(async () => {
        if (!imageBase64) return;

        const config = getOcrConfig();
        if (!config.apiBase || !config.apiKey || !config.modelName) {
            message.warning("请先在设置中配置 OCR API");
            return;
        }

        setOcrLoading(true);
        setOcrText("");
        setTranslatedText("");
        setShowTranslation(false);

        try {
            const result = await callOcrApi(imageBase64, config);
            setOcrText(result);
        } catch (error) {
            message.error(`OCR 识别失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setOcrLoading(false);
        }
    }, [imageBase64]);

    // 执行翻译
    const performTranslate = async () => {
        if (!ocrText) {
            message.warning("没有可翻译的文本");
            return;
        }

        const config = getTranslateConfig();
        if (!config.apiBase || !config.apiKey || !config.modelName) {
            message.warning("请先在设置中配置翻译 API");
            return;
        }

        setTranslateLoading(true);

        try {
            const result = await callTranslateApi(ocrText, config);
            setTranslatedText(result);
            setShowTranslation(true);
        } catch (error) {
            message.error(`翻译失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setTranslateLoading(false);
        }
    };

    // 复制文本到剪贴板
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            message.success("已复制到剪贴板");
        } catch (error) {
            message.error("复制失败");
        }
    };

    // 初始自动执行 OCR
    useEffect(() => {
        if (imageBase64) {
            performOcr();
        }
    }, [imageBase64, performOcr]);

    return (
        <div className="ocr-result-container">
            <style jsx>{`
        .ocr-result-container {
          display: flex;
          height: 100%;
          background: #1a1a2e;
          color: #fff;
          border-radius: 8px;
          overflow: hidden;
        }
        .image-panel {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #333;
        }
        .result-panel {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        .image-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a15;
          border-radius: 8px;
          overflow: hidden;
        }
        .image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .text-container {
          flex: 1;
          background: #0a0a15;
          border-radius: 8px;
          padding: 12px;
          overflow-y: auto;
          margin-bottom: 12px;
        }
        .toolbar {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #333;
        }
        .model-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #252540;
          border-radius: 6px;
        }
      `}</style>

            {/* 左侧：图片面板 */}
            <div className="image-panel">
                <div className="image-container">
                    {imageBase64 && (
                        <img src={`data:image/png;base64,${imageBase64}`} alt="Screenshot" />
                    )}
                </div>
                <div className="toolbar">
                    <div className="model-info">
                        <img src="/icons/openai.svg" alt="model" width={20} height={20} />
                        <Text style={{ color: "#888" }}>{getOcrConfig().modelName || "未配置"}</Text>
                    </div>
                    <Button type="primary" onClick={performOcr} loading={ocrLoading} icon={<ReloadOutlined />}>
                        重新识别
                    </Button>
                </div>
            </div>

            {/* 右侧：结果面板 */}
            <div className="result-panel">
                <div className="text-container">
                    {ocrLoading ? (
                        <div style={{ textAlign: "center", padding: 40 }}>
                            <Spin size="large" />
                            <Text style={{ display: "block", marginTop: 16, color: "#888" }}>
                                正在识别中...
                            </Text>
                        </div>
                    ) : (
                        <Paragraph style={{ color: "#fff", margin: 0, whiteSpace: "pre-wrap" }}>
                            {ocrText || "等待 OCR 识别结果..."}
                        </Paragraph>
                    )}
                </div>

                {/* 翻译结果 */}
                {showTranslation && translatedText && (
                    <>
                        <Divider style={{ margin: "8px 0", borderColor: "#333" }} />
                        <div className="text-container" style={{ background: "#1e1e3f" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <img src="/icons/translate.svg" alt="translate" width={16} height={16} />
                                <Text style={{ color: "#888" }}>{getTranslateConfig().modelName}</Text>
                            </div>
                            <Paragraph style={{ color: "#fff", margin: 0, whiteSpace: "pre-wrap" }}>
                                {translatedText}
                            </Paragraph>
                        </div>
                    </>
                )}

                {/* 工具栏 */}
                <div className="toolbar">
                    <Space>
                        <Tooltip title="复制原文">
                            <Button
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(ocrText)}
                                disabled={!ocrText}
                            />
                        </Tooltip>
                        <Tooltip title="复制翻译">
                            <Button
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(translatedText)}
                                disabled={!translatedText}
                            />
                        </Tooltip>
                    </Space>
                    <Button
                        type="primary"
                        icon={<TranslationOutlined />}
                        onClick={performTranslate}
                        loading={translateLoading}
                        disabled={!ocrText}
                    >
                        翻译
                    </Button>
                </div>
            </div>
        </div>
    );
}
