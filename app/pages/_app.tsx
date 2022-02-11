import { NextUIProvider, createTheme } from "@nextui-org/react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import * as React from "react";

const APIProvider = dynamic(
  () => {
    return import("../src/provider");
  },
  { ssr: false }
);

const dark_theme = createTheme({
  type: "dark",
  theme: {}
});

export const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <NextUIProvider theme={dark_theme}>
      <APIProvider>
        <Component {...pageProps} />
      </APIProvider>
    </NextUIProvider>
  );
};

export default App;
