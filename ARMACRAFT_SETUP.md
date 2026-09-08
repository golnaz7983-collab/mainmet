# ArMaCraft online setup

- Host: `ArMaCraftnet.aternos.me`
- Port: `60107`
- Software: Fabric
- Version shown in Aternos: `1.21.11 (0.19.3)`
- `online-mode=false`

A normal Aternos Java TCP address cannot be connected to directly from a browser. Browser multiplayer needs a WebSocket/WSS-to-TCP proxy in front of the Java server.

For account registration/login, use a server-side Fabric authentication mod. **Authenticate** supports `/register <password> <confirm>` and `/login <password>` on supported Fabric versions. **AuthCore** is another server-side Fabric option with BCrypt + SQLite for 1.21.1. Never store player passwords in GitHub Pages/localStorage.

For a 5 km x 5 km playable area, use a 5000-block world border on the Java server. That is 25 km² = 2500 hectares. Let the Java server generate chunks as players explore rather than generating a 5000x5000 browser map at once.

The mainmet Join UI is ready for the WSS endpoint. The final real online join requires deploying a compatible EaglercraftX WebSocket proxy (normally with Velocity/Bungee) and then entering its `wss://...` endpoint in the ArMaCraft panel.
