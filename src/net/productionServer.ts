// The hosted UI is static Cloudflare Pages. Multiplayer connects directly to
// the deployed session server; /games/grand-century/ws serves HTML at the edge.
export const PRODUCTION_MULTIPLAYER_URL =
  "wss://gc-server.lakesidegames.net/ws";
