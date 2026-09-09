# ArMaCraft WSS Proxy

This repo now contains a Render Blueprint for a WebSocket-to-TCP bridge for:

`ArMaCraftnet.aternos.me:60107`

## One-click deploy

Use the official Render deploy flow with this repository:

https://render.com/deploy?repo=https://github.com/golnaz7983-collab/mainmet

Render will show the Blueprint for review. Click **Apply/Deploy** only after checking the service name `armacraft-wss-proxy`.

After deployment, the browser endpoint is:

`wss://<your-render-host>/arma`

The HTTP health endpoint is:

`https://<your-render-host>/health`

## Important

The proxy only bridges binary WebSocket traffic to the fixed ArMaCraft Java endpoint. It does not store Minecraft passwords and it does not install or update any server authentication mod.

The current mainmet browser game still needs a Minecraft-protocol client before its in-browser game can actually log into a Java server through this bridge.
