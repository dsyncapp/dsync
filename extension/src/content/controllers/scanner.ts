import * as fallback from "./fallback-controller";
import * as netflix from "./netflix-controller";
import * as defs from "./definitions";

type Scanner = {
  host: RegExp;
  create: (video: HTMLVideoElement) => defs.PlayerController;
};

const scanners: Scanner[] = [
  {
    host: /.*netflix.com$/,
    create: netflix.createNetflixController
  },
  {
    host: /.*/,
    create: fallback.createFallbackController
  }
];

export const create = (video: HTMLVideoElement) => {
  const scanner = scanners.find((scanner) => {
    return scanner.host.test(window.location.host);
  });

  return scanner?.create(video);
};
