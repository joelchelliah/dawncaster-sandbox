const fs = require("fs");

async function fetchChallengeData() {
  try {
    const response = await fetch("https://blightbane.io/api/allchallenges");
    const challenges = (await response.json()).challenges.reverse();

    const impossibleStats = [];
    const hardStats = [];
    const challengingStats = [];
    const normalStats = [];
    for (const challenge of challenges) {
      const detailResponse = await fetch(
        `https://blightbane.io/api/challenge/${challenge.uid}`
      );
      const data = (await detailResponse.json()).challenge;

      const cleanUpWinner = (winner) => {
        if (!winner) return "ANONYMOUS?!";
        const trimmed = winner.toLowerCase().trim();

        return trimmed === "deeeef." ? "deeeef" : trimmed;
      };

      impossibleStats.push({
        uid: data.uid,
        name: data.name,
        winner: cleanUpWinner(data.winners[0]),
      });
      hardStats.push({
        uid: data.uid,
        name: data.name,
        winner: cleanUpWinner(data.winners[1]),
      });
      challengingStats.push({
        uid: data.uid,
        name: data.name,
        winner: cleanUpWinner(data.winners[2]),
      });
      normalStats.push({
        uid: data.uid,
        name: data.name,
        winner: cleanUpWinner(data.winners[3]),
      });
    }

    const statsData = {
      impossibleStats,
      hardStats,
      challengingStats,
      normalStats,
    };

    fs.writeFileSync(
      "data/challenge_stats.json",
      JSON.stringify(statsData, null, 2)
    );

    return statsData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

function generateHtml(stats) {
  const template = fs.readFileSync("templates/challenge_stats.html", "utf8");

  const impossibleProgress = processStats(stats.impossibleStats);
  const hardProgress = processStats(stats.hardStats);
  const challengingProgress = processStats(stats.challengingStats);
  const normalProgress = processStats(stats.normalStats);

  const html = template
    .replace("IMPOSSIBLE_STATS", JSON.stringify(stats.impossibleStats))
    .replace("IMPOSSIBLE_PROGRESS", JSON.stringify(impossibleProgress))
    .replace("HARD_STATS", JSON.stringify(stats.hardStats))
    .replace("HARD_PROGRESS", JSON.stringify(hardProgress))
    .replace("CHALLENGING_STATS", JSON.stringify(stats.challengingStats))
    .replace("CHALLENGING_PROGRESS", JSON.stringify(challengingProgress))
    .replace("NORMAL_STATS", JSON.stringify(stats.normalStats))
    .replace("NORMAL_PROGRESS", JSON.stringify(normalProgress));

  fs.writeFileSync("challenge_stats.html", html);
}

function processStats(stats) {
  const progress = {};
  stats.forEach(({ winner }) => {
    if (!progress[winner]) {
      progress[winner] = new Array(stats.length).fill(0);
    }
  });

  stats.forEach(({ winner }, index) => {
    if (index > 0) {
      Object.keys(progress).forEach((player) => {
        progress[player][index] = progress[player][index - 1];
      });
    }
    progress[winner][index]++;
  });
  return progress;
}

function readStatsFromFile() {
  try {
    const data = fs.readFileSync("data/challenge_stats.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading stats file:", error);
    return null;
  }
}

async function main() {
  const shouldFetch = process.argv.includes("--fetch");

  if (shouldFetch) {
    console.log("\nFetching stats...");
    await fetchChallengeData();
    console.log("Stats fetched! 💾");
  }

  const stats = readStatsFromFile();
  if (!stats) {
    console.error("No stats file found! Run with --fetch to fetch new data.");
    process.exit(1);
  }

  console.log("\nGenerating chart...");
  generateHtml(stats);
  console.log("Chart generated! 📊");
}

main();
