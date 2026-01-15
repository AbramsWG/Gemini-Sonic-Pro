
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, MultiSpeakerConfig } from "../types";
import { decode, decodeAudioData } from "./audioUtils";

export class GeminiSpeechService {
  /**
   * 使用 Gemini TTS 生成单人语音。
   */
  async generateSpeech(text: string, voice: VoiceName): Promise<AudioBuffer> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      throw new Error("输入内容不能为空。");
    }

    // 更新指令为中文，引导模型更准确地理解意图
    const formattedText = `请朗读以下内容： "${trimmedText}"`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: formattedText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      
      if (!candidate) {
        throw new Error("服务未返回响应，请重试。");
      }

      if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
        throw new Error(`合成被拦截 (原因: ${candidate.finishReason})。请尝试修改内容。`);
      }

      const audioPart = candidate.content?.parts?.find(p => p.inlineData?.data);
      const base64Audio = audioPart?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("模型未能生成音频数据。这可能是因为提示词过于复杂，或触发了安全过滤。");
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
    } catch (err: any) {
      console.error("Gemini TTS Error:", err);
      if (err.message?.includes("500") || err.status === 500) {
        throw new Error("Gemini 语音引擎繁忙或内容过于复杂。请尝试缩短文本内容。");
      }
      throw err;
    }
  }

  /**
   * 使用 Gemini TTS 生成多角色对话语音。
   */
  async generateMultiSpeakerSpeech(
    text: string, 
    config: MultiSpeakerConfig
  ): Promise<AudioBuffer> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanedText = text.trim();
    if (!cleanedText) throw new Error("对话内容不能为空。");

    // 格式化的多角色指令
    const prompt = `请朗读以下 ${config.speaker1.name} 和 ${config.speaker2.name} 之间的对话：\n${cleanedText}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: config.speaker1.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: config.speaker1.voice }
                  }
                },
                {
                  speaker: config.speaker2.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: config.speaker2.voice }
                  }
                }
              ]
            }
          }
        }
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
      const base64Audio = audioPart?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("多角色合成失败。请确保对话中的名称与配置的名称完全一致。");
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
    } catch (err: any) {
      console.error("Gemini Multi-TTS Error:", err);
      if (err.status === 500) throw new Error("服务器错误。请尝试简化对话内容。");
      throw err;
    }
  }
}

export const speechService = new GeminiSpeechService();
