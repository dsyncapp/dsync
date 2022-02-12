export type VideoManagerHooks = {
  onSeek: (playback: number) => void;
  onPause: () => void;
  onResume: () => void;
};

export type VideoManager = {
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
};
