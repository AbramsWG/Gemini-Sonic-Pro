
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export interface AudioHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  voice: string;
  duration: number;
  blobUrl: string;
}

export interface MultiSpeakerConfig {
  speaker1: { name: string; voice: VoiceName };
  speaker2: { name: string; voice: VoiceName };
}
