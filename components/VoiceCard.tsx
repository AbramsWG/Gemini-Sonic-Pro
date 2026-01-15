
import React from 'react';
import { VoiceName } from '../types';

interface VoiceCardProps {
  name: VoiceName;
  isSelected: boolean;
  onSelect: (name: VoiceName) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({ name, isSelected, onSelect }) => {
  const getInitials = (n: string) => n.substring(0, 1);
  
  return (
    <button
      onClick={() => onSelect(name)}
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 group ${
        isSelected 
          ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] border-2' 
          : 'glass hover:bg-white/5 border border-white/10'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-2 ${
        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
      }`}>
        {getInitials(name)}
      </div>
      <span className={`text-sm font-medium ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>
        {name}
      </span>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
        </div>
      )}
    </button>
  );
};
