const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
// Adjust these parameters to change the shape of your contribution graph

// Number of days to look back
const DAYS_BACK = 180;

// Maximum contributions per day
const MAX_COMMITS_PER_DAY = 7;

// Probability of a day having commits (0.0 to 1.0)
const CHANCE_OF_COMMIT = 0.6;

// The file to modify to trigger commits
const DUMMY_FILE = 'contributions.md';

const commitMessages = [
    "refactor: optimize data ingestion pipeline",
    "fix: resolve WebSocket connection drops",
    "feat: add new SAR polling endpoints",
    "docs: update API documentation",
    "style: improve tactical map rendering performance",
    "test: add unit tests for Kalman filter",
    "chore: update dependencies",
    "fix: correct MGRS coordinate conversion edge case",
    "feat: implement ATR alert system",
    "refactor: clean up CesiumJS initialization",
    "perf: dramatically improve Deck.gl rendering speed",
    "feat: add support for SAT-AIS feeds",
    "fix: handle missing transponder data gracefully",
    "docs: document intelligence feed RAG architecture"
];

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomCommitMessage() {
    return commitMessages[getRandomInt(commitMessages.length)];
}

function formatDateForGit(date) {
    // Format: YYYY-MM-DDTHH:MM:SS
    // We need to provide a timezone offset or just let git handle local time.
    // Git accepts strict ISO 8601 format. Let's build a simple localized string that git likes.
    const isoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    return isoString;
}

function generateCommits() {
    console.log(`Starting fake commit generation for the last ${DAYS_BACK} days...`);

    // Ensure we are inside a git repository
    try {
        execSync('git status', { stdio: 'ignore' });
    } catch (e) {
        console.log("Initializing new git repository...");
        execSync('git init');
    }

    // Touch the dummy file if it doesn't exist
    if (!fs.existsSync(DUMMY_FILE)) {
        fs.writeFileSync(DUMMY_FILE, '# Contribution Log\n\n');
        execSync(`git add ${DUMMY_FILE}`);
        execSync(`git commit -m "Initial commit for contribution log"`);
    }

    const today = new Date();
    let totalCommits = 0;

    for (let i = DAYS_BACK; i >= 0; i--) {
        // Decide if this day gets commits
        if (Math.random() > CHANCE_OF_COMMIT) {
            continue;
        }

        const commitsToday = getRandomInt(MAX_COMMITS_PER_DAY) + 1;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);

        for (let j = 0; j < commitsToday; j++) {
            // Add some jitter to the time during the day
            targetDate.setHours(9 + getRandomInt(8)); // Between 9am and 5pm
            targetDate.setMinutes(getRandomInt(60));
            targetDate.setSeconds(getRandomInt(60));

            const dateStr = formatDateForGit(targetDate);
            const message = getRandomCommitMessage();

            // Modify the file to give git something to commit
            fs.appendFileSync(DUMMY_FILE, `Commit on ${dateStr} - ${message}\n`);

            // Add and commit with the specific date
            execSync(`git add ${DUMMY_FILE}`);
            
            // Set environment variables for the specific command execution
            const env = { ...process.env, GIT_AUTHOR_DATE: dateStr, GIT_COMMITTER_DATE: dateStr };
            
            try {
                execSync(`git commit -m "${message}"`, { env, stdio: 'ignore' });
                totalCommits++;
                process.stdout.write('.'); // progress indicator
            } catch (err) {
                 console.error(`\nFailed to commit for date: ${dateStr}`);
            }
        }
    }

    console.log(`\n\n✅ Done! Generated ${totalCommits} fake commits over the last ${DAYS_BACK} days.`);
    console.log(`Don't forget to run 'git push origin main' to send these to GitHub!`);
}

generateCommits();
