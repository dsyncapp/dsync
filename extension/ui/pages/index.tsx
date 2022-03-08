import type { NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

const Root = dynamic(() => import("../src/root"), {
  ssr: false
});

const Home: NextPage = () => {
  return <Root />;
};

export default Home;
