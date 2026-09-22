#!/bin/bash
# Double-click in Finder: starts the local demo server (if needed) and opens the gallery.
# Close the Terminal window it opens to stop the server.
cd "$(dirname "$0")"
export PATH="$HOME/.node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
PORT=8765
if ! lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  node serve.mjs $PORT &
  sleep 1
fi
open "http://localhost:$PORT/"
echo "Kites demos running at http://localhost:$PORT/ — close this window to stop."
wait
