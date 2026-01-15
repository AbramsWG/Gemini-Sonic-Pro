
import React, { useState, useRef, useCallback } from 'react';
import { VoiceName, AudioHistoryItem, MultiSpeakerConfig } from './types';
import { AVAILABLE_VOICES, DEFAULT_PROMPT } from './constants';
import { speechService } from './services/geminiService';
import { bufferToWavBlob } from './services/audioUtils';
import { VoiceCard } from './components/VoiceCard';
import { AudioVisualizer } from './components/AudioVisualizer';

const App: React.FC = () => {
  const [text, setText] = useState(DEFAULT_PROMPT);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(AVAILABLE_VOICES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMultiSpeaker, setIsMultiSpeaker] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [multiConfig, setMultiConfig] = useState<MultiSpeakerConfig>({
    speaker1: { name: '小王', voice: AVAILABLE_VOICES[0] },
    speaker2: { name: '小李', voice: AVAILABLE_VOICES[1] }
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.connect(audioContextRef.current.destination);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    initAudio();

    try {
      let buffer: AudioBuffer;
      if (isMultiSpeaker) {
        buffer = await speechService.generateMultiSpeakerSpeech(text, multiConfig);
      } else {
        buffer = await speechService.generateSpeech(text, selectedVoice);
      }
      
      const blob = bufferToWavBlob(buffer);
      const url = URL.createObjectURL(blob);

      const newItem: AudioHistoryItem = {
        id: crypto.randomUUID(),
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        timestamp: Date.now(),
        voice: isMultiSpeaker ? `${multiConfig.speaker1.name} & ${multiConfig.speaker2.name}` : selectedVoice,
        duration: buffer.duration,
        blobUrl: url
      };

      setHistory(prev => [newItem, ...prev]);
      playBuffer(buffer);
    } catch (error: any) {
      console.error("Speech generation failed:", error);
      setErrorMsg(error.message || "发生未知的合成错误。");
    } finally {
      setIsGenerating(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current || !analyserRef.current) return;
    
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(analyserRef.current);
    source.onended = () => setIsPlaying(false);
    
    setIsPlaying(true);
    source.start(0);
    sourceRef.current = source;
  };

  const playHistoryItem = async (url: string) => {
    initAudio();
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      playBuffer(audioBuffer);
    } catch (e) {
      setErrorMsg("历史音频播放失败。");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <header className="w-full flex flex-col items-center text-center space-y-2 mt-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span>下一代 TTS 引擎</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-slate-400">
          Gemini 语音大师 (Pro)
        </h1>
        <p className="text-slate-400 max-w-xl text-lg">
          利用 Gemini 2.5 Flash 的强大性能，将文本转化为高保真的人类语音。
        </p>
      </header>

      {errorMsg && (
        <div className="w-full max-w-2xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400/50 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <main className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">输入文本</label>
              <div className="flex items-center space-x-2 bg-slate-900/50 p-1 rounded-lg border border-white/5">
                <button 
                  onClick={() => setIsMultiSpeaker(false)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${!isMultiSpeaker ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  单人模式
                </button>
                <button 
                  onClick={() => setIsMultiSpeaker(true)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${isMultiSpeaker ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  对话模式
                </button>
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isMultiSpeaker ? "小王: 你好！ \n小李: 嘿，你好，小王！" : "请输入要合成的文本内容..."}
              className="w-full h-40 bg-black/30 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-200 placeholder-slate-600 resize-none mono text-sm leading-relaxed"
            />

            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {AVAILABLE_VOICES.map((v) => (
                <VoiceCard 
                  key={v} 
                  name={v} 
                  isSelected={!isMultiSpeaker && selectedVoice === v}
                  onSelect={(v) => {
                    setSelectedVoice(v);
                    setIsMultiSpeaker(false);
                  }}
                />
              ))}
            </div>

            {isMultiSpeaker && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/5 animate-in zoom-in-95">
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-mono">说话人 1</span>
                  <div className="flex gap-2">
                    <input 
                      className="bg-black/20 border border-white/10 rounded-lg p-2 text-xs w-full outline-none focus:border-indigo-500/50" 
                      value={multiConfig.speaker1.name}
                      onChange={e => setMultiConfig(prev => ({...prev, speaker1: {...prev.speaker1, name: e.target.value}}))}
                    />
                    <select 
                      className="bg-slate-800 border-none rounded-lg p-2 text-xs outline-none cursor-pointer"
                      value={multiConfig.speaker1.voice}
                      onChange={e => setMultiConfig(prev => ({...prev, speaker1: {...prev.speaker1, voice: e.target.value as VoiceName}}))}
                    >
                      {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-mono">说话人 2</span>
                  <div className="flex gap-2">
                    <input 
                      className="bg-black/20 border border-white/10 rounded-lg p-2 text-xs w-full outline-none focus:border-indigo-500/50" 
                      value={multiConfig.speaker2.name}
                      onChange={e => setMultiConfig(prev => ({...prev, speaker2: {...prev.speaker2, name: e.target.value}}))}
                    />
                    <select 
                      className="bg-slate-800 border-none rounded-lg p-2 text-xs outline-none cursor-pointer"
                      value={multiConfig.speaker2.voice}
                      onChange={e => setMultiConfig(prev => ({...prev, speaker2: {...prev.speaker2, voice: e.target.value as VoiceName}}))}
                    >
                      {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed font-bold text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>正在合成...</span>
                </>
              ) : (
                <span>生成语音内容</span>
              )}
            </button>
          </section>

          <AudioVisualizer analyser={analyserRef.current} isActive={isPlaying} />
        </div>

        <aside className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">语音库</h2>
            <span className="text-[10px] text-slate-500 mono">{history.length} 条记录</span>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="glass p-8 rounded-xl text-center space-y-2 border-dashed border-white/10 bg-transparent">
                <p className="text-slate-500 text-sm italic">库内空空如也。</p>
                <p className="text-xs text-slate-600">生成的音频将出现在这里。</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="glass p-4 rounded-xl group hover:border-indigo-500/30 transition-all animate-in slide-in-from-right-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 mono">
                      {item.voice}
                    </span>
                    <span className="text-[10px] text-slate-600 mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed italic">
                    "{item.text}"
                  </p>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => playHistoryItem(item.blobUrl)}
                      className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                      title="播放"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <a 
                      href={item.blobUrl} 
                      download={`gemini-audio-${item.id}.wav`}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                      title="下载"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <div className="flex-1 text-right text-[10px] text-slate-600 mono">
                      {item.duration.toFixed(1)}秒
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      <footer className="w-full pt-12 pb-8 flex flex-col items-center space-y-4 border-t border-white/5">
        <div className="flex space-x-6 text-slate-500 text-xs uppercase tracking-widest font-medium">
          <span className="hover:text-indigo-400 transition-colors cursor-default">Gemini API</span>
          <span className="hover:text-indigo-400 transition-colors cursor-default">Edge 运行时</span>
          <span className="hover:text-indigo-400 transition-colors cursor-default">Sonic-TTS v2.5</span>
        </div>
        <div className="text-slate-600 text-[10px] mono uppercase">
          &copy; {new Date().getFullYear()} PROXIMA 实验室 // 仅供研究使用
        </div>
      </footer>
    </div>
  );
};

export default App;
