import { StateContext, api } from "./context";
import { ApplicationState } from "./api";
import * as React from "react";

export const APIProvider: React.FC = (props) => {
  const [state, setState] = React.useState<ApplicationState>(api.state);

  React.useEffect(() => {
    return api.subscribe(setState);
  }, []);

  return <StateContext.Provider value={[state, api]}>{props.children}</StateContext.Provider>;
};

export default APIProvider;
