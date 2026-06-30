import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";

export const PIPECAT_API_URL = (
  import.meta.env.VITE_PIPECAT_API_URL ?? "http://localhost:7860"
).replace(/\/$/, "");

// Create one client for the app lifetime. Reusing the instance avoids duplicate
// media managers and global event listeners during React re-renders.
export const pipecatClient = new PipecatClient({
  transport: new SmallWebRTCTransport(),
  enableMic: true,
  enableCam: false,
  disconnectOnBotDisconnect: true,
});
