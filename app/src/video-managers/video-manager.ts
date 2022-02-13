export type VideoManagerHooks = {
  onNavigate: (source: string) => void;
  onSeek: (playback: number) => void;
  onPause: () => void;
  onResume: () => void;
};

export type VideoManager = {
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
};
