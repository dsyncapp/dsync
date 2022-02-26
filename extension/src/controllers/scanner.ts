import * as fallback from "./fallback-controller";
import * as netflix from "./netflix-controller";

const scanners = [
  {
    host: /.*netflix.com$/,
    scan: () => netflix.createNetflixController()
  },
  {
    host: /.*/,
    scan: () => fallback.createFallbackController()
  }
];

export const scanForPlayer = () => {
  const scanner = scanners.find((scanner) => {
    return scanner.host.test(window.location.host);
  });

  return scanner?.scan();
};
