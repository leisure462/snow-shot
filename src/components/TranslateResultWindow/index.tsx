/**
 * 翻译结果展示窗口
 * 显示 OCR 文本和翻译结果
 */

import { useState, useEffect, useCallback } from "react";
import { Button, Typography, Space, Spin, message, Tooltip } from "antd";
import { CopyOutlined, SoundOutlined, CloseOutlined, SwapOutlined } from "@ant-design/icons";
import { callOcrApi, callTranslateApi } from "@/services/customApiService";
import { getOcrConfig } from "@/pages/settings/ocrSettings";
import { getTranslateConfig } from "@/pages/settings/translateSettings";

const { Text, Paragraph } = Typography;

interface TranslateResultWindowProps {
    imageBase64: string;
    onClose?: () => void;
}

export default function TranslateResultWindow({ imageBase64, onClose }: TranslateResultWindowProps) {
    const [ocrText, setOcrText] = useState<string>("");
    const [translatedText, setTranslatedText] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState("英语");

    // 执行 OCR + 翻译
    const performOcrAndTranslate = useCallback(async () => {
        if (!imageBase64) return;

        const ocrConfig = getOcrConfig();
        const translateConfig = getTranslateConfig();

        if (!ocrConfig.apiBase || !ocrConfig.apiKey || !ocrConfig.modelName) {
            message.warning("请先在设置中配置 OCR API");
            return;
        }

        if (!translateConfig.apiBase || !translateConfig.apiKey || !translateConfig.modelName) {
            message.warning("请先在设置中配置翻译 API");
            return;
        }

        setLoading(true);
        setTargetLanguage(translateConfig.targetLanguage);

        try {
            // 先进行 OCR
            const ocrResult = await callOcrApi(imageBase64, ocrConfig);
            setOcrText(ocrResult);

            // 再进行翻译
            const translateResult = await callTranslateApi(ocrResult, translateConfig);
            setTranslatedText(translateResult);
        } catch (error) {
            message.error(`处理失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    }, [imageBase64]);

    // 复制文本到剪贴板
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            message.success("已复制到剪贴板");
        } catch (error) {
            message.error("复制失败");
        }
    };

    // 初始自动执行
    useEffect(() => {
        if (imageBase64) {
            performOcrAndTranslate();
        }
    }, [imageBase64, performOcrAndTranslate]);

    return (
        <div className="translate-result-container">
            <style jsx>{`
        .translate-result-container {
          display: flex;
          flex-direction: column;
          min-width: 400px;
          max-width: 600px;
          background: #1a1a2e;
          color: #fff;
          border-radius: 8px;
          padding: 16px;
        }
        .close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
        }
        .section {
          margin-bottom: 16px;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .text-box {
          background: #0a0a15;
          border-radius: 8px;
          padding: 12px;
          min-height: 60px;
        }
        .toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .model-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: #252540;
          border-radius: 4px;
          font-size: 12px;
        }
        .language-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: #6366f1;
          border-radius: 12px;
          font-size: 12px;
        }
      `}</style>

            {onClose && (
                <Button
                    className="close-btn"
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={onClose}
                    style={{ position: "absolute", top: 8, right: 8, color: "#888" }}
                />
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <Spin size="large" />
                    <Text style={{ display: "block", marginTop: 16, color: "#888" }}>
                        正在识别并翻译中...
                    </Text>
                </div>
            ) : (
                <>
                    {/* OCR 原文 */}
                    <div className="section">
                        <div className="section-header">
                            <Text style={{ color: "#fff" }}>{ocrText.slice(0, 30)}...</Text>
                            <div className="toolbar">
                                <Tooltip title="朗读">
                                    <Button type="text" icon={<SoundOutlined />} size="small" style={{ color: "#888" }} />
                                </Tooltip>
                                <Tooltip title="复制">
                                    <Button
                                        type="text"
                                        icon={<CopyOutlined />}
                                        size="small"
                                        style={{ color: "#888" }}
                                        onClick={() => copyToClipboard(ocrText)}
                                    />
                                </Tooltip>
                                <Tooltip title="分词">
                                    <Button type="text" icon={<SwapOutlined />} size="small" style={{ color: "#888" }} />
                                </Tooltip>
                                <span className="language-tag">
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7" }} />
                                    {targetLanguage}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 翻译结果 */}
                    <div className="section">
                        <div className="model-tag">
                            <img src="/icons/deepseek.svg" alt="model" width={16} height={16} />
                            <Text style={{ color: "#888" }}>{getTranslateConfig().modelName}</Text>
                            <Button type="text" icon={<CloseOutlined />} size="small" style={{ color: "#666", marginLeft: 4 }} />
                        </div>
                        <div className="text-box" style={{ marginTop: 8 }}>
                            <Paragraph style={{ color: "#fff", margin: 0, whiteSpace: "pre-wrap" }}>
                                {translatedText || "翻译结果将显示在这里..."}
                            </Paragraph>
                        </div>
                        <div className="toolbar">
                            <Tooltip title="朗读">
                                <Button type="text" icon={<SoundOutlined />} size="small" style={{ color: "#888" }} />
                            </Tooltip>
                            <Tooltip title="复制">
                                <Button
                                    type="text"
                                    icon={<CopyOutlined />}
                                    size="small"
                                    style={{ color: "#888" }}
                                    onClick={() => copyToClipboard(translatedText)}
                                />
                            </Tooltip>
                            <Tooltip title="分词">
                                <Button type="text" icon={<SwapOutlined />} size="small" style={{ color: "#888" }} />
                            </Tooltip>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
