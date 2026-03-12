git add .gitignore package.json package-lock.json vite.config.js index.html README.md
git commit -m "chore: initial project scaffold and build configuration"

git add src/styles/
git commit -m "feat(ui): implement military dark theme design system"

git add src/utils/
git commit -m "feat(ui): add coordinate conversion and MIL-STD-2525 symbology utilities"

git add server/generators/ server/data/
git commit -m "feat(backend): implement simulated ISR data feeds (ADS-B, AIS, Radar, OSINT)"

git add server/processing/
git commit -m "feat(backend): build intelligence processing pipelines (Kalman, DGE-RAG, ATR)"

git add server/server.js
git commit -m "feat(backend): setup WebSocket real-time delivery and REST APIs"

git add src/components/
git commit -m "feat(ui): create tactical command components (Header, Intel, Alerts, Entity Panel)"

git add src/views/ src/main.js
git commit -m "feat(app): integrate Deck.gl tactical map and application state management"

git remote add origin https://github.com/sujal-b/CENTCOM.git
git branch -M main
git push -u origin main -f
