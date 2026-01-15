
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrame = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const r = 99 + (i * 2);
        const g = 102 + (i / 5);
        const b = 241;

        ctx.fillStyle = isActive ? `rgb(${r},${g},${b})` : '#334155';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [analyser, isActive]);

  return (
    <div className="w-full h-32 glass rounded-xl overflow-hidden relative border-t border-white/5">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={128} 
        className="w-full h-full opacity-60"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs uppercase tracking-widest pointer-events-none">
          等待音频信号...
        </div>
      )}
    </div>
  );
};
