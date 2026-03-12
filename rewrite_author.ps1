git config user.name "sujal-b"
# Using the GitHub-provided noreply email for sujal-b to keep email private while attributing commits correctly to their account
git config user.email "sujal-b@users.noreply.github.com"

# Reset repository and redefine the grouped commits with the new author identity
git reset --soft d4e50615f7adf65851986d61bdf39a7af3335ea2

# Delete all new commits we just made and recreate them under the new author
git reset --hard d4e50615f7adf65851986d61bdf39a7af3335ea2
git pull origin main

# Re-run the commit grouping with new global config
git add .gitignore package.json package-lock.json vite.config.js index.html README.md commit_and_push.ps1
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

git push -u origin main --force

# Restore original config
git config user.name "heidi4"
git config user.email "7evencloudstar@gmail.com"
