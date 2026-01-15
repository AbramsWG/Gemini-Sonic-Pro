
import { VoiceName } from './types';

export const AVAILABLE_VOICES: VoiceName[] = [
  VoiceName.Kore,
  VoiceName.Puck,
  VoiceName.Charon,
  VoiceName.Fenrir,
  VoiceName.Zephyr
];

// 使用更亲切的中文默认提示
export const DEFAULT_PROMPT = "你好！我是 Gemini 语音大师。很高兴为你服务，请问有什么我可以帮你的吗？";

export const APP_THEME = {
  primary: 'indigo-500',
  secondary: 'emerald-400',
  accent: 'fuchsia-500',
  bg: 'slate-950'
};
