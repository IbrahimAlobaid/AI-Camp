import { PipecatClientAudio, PipecatClientProvider } from "@pipecat-ai/client-react";
import { StrictMode, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/app";
import { pipecatClient } from "./lib/pipecat-client";
import "./styles.css";

// client-react 1.7.1 bundles a nominal PipecatClient declaration in its type
// file. The runtime provider accepts the official client-js instance used here,
// so this narrow compatibility cast bridges only that package declaration issue.
const providerClient = pipecatClient as unknown as ComponentProps<
  typeof PipecatClientProvider
>["client"];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PipecatClientProvider client={providerClient}>
      <App />
      <PipecatClientAudio />
    </PipecatClientProvider>
  </StrictMode>,
);
