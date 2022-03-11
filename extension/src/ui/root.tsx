import * as Next from "@nextui-org/react";
import * as ReactDOM from "react-dom";
import Helmet from "react-helmet";
import * as React from "react";

import App from "./app";

const dark_theme = Next.createTheme({
  type: "dark",
  theme: {}
});

const Root = () => {
  return (
    <Next.NextUIProvider theme={dark_theme}>
      {/* @ts-ignore */}
      <Helmet>{Next.CssBaseline.flush()}</Helmet>
      <App />
    </Next.NextUIProvider>
  );
};

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Root />, document.getElementById("root"));
});
