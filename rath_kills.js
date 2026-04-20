const fs = require("fs");
const { createDir } = require("./utils/file");

const dirName = "data";
const classes = ["Arcanist", "Rogue", "Seeker", "Warrior", "Hunter", "Knight"];

function parseDifficulty(diffArg) {
  if (!diffArg) return "Impossible";
  const normalized = diffArg.toLowerCase();
  if (normalized === "hard") return "Hard";
  if (normalized === "impossible") return "Impossible";
  console.error(
    `Invalid difficulty: ${diffArg}. Using "Impossible" as default.`,
  );
  return "Impossible";
}

async function fetchRunsForClass(className, difficulty) {
  try {
    const url = `https://blightbane.io/api/speedruns?diff=${difficulty}&class=${className}&top=100000&options=&nolimit=true`;
    console.log(`Fetching runs for ${className} (${difficulty})...`);
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching runs for ${className}:`, error);
    return null;
  }
}

async function fetchAllRuns(difficulty) {
  createDir(dirName);

  for (const className of classes) {
    const fileName = `${dirName}/speedruns_${difficulty.toLowerCase()}_${className.toLowerCase()}.json`;
    const data = await fetchRunsForClass(className, difficulty);

    if (data) {
      fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
      console.log(`Saved ${className} runs to ${fileName}`);
    }
  }
}

function readRunsFromFiles(difficulty) {
  const allRuns = [];

  for (const className of classes) {
    // Try new format first (with difficulty prefix)
    let fileName = `${dirName}/speedruns_${difficulty.toLowerCase()}_${className.toLowerCase()}.json`;
    let fileExists = fs.existsSync(fileName);

    // Fall back to old format (without difficulty prefix) for backward compatibility
    if (!fileExists) {
      fileName = `${dirName}/speedruns_${className.toLowerCase()}.json`;
      fileExists = fs.existsSync(fileName);
    }

    if (!fileExists) {
      console.error(`File not found: ${fileName}`);
      continue;
    }

    try {
      const data = fs.readFileSync(fileName, "utf8");
      const parsed = JSON.parse(data);

      // The API returns an array with objects that have keys like "Arcanist-Impossible"
      // We need to extract the runs from these nested structures
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const key = `${className}-${difficulty}`;
          if (item[key] && Array.isArray(item[key])) {
            allRuns.push(...item[key]);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading ${fileName}:`, error);
    }
  }

  return allRuns;
}

const player_aliases = {
  samdekatt_85781: "sam",
  valko2511: "valko",
  Valko: "valko",
  TheWarden6606: "thewarden6606",
};

function countRathKillsByPlayer(runs) {
  const rathKills = {};

  for (const run of runs) {
    if (!run.bosses || !Array.isArray(run.bosses)) continue;

    const hasRath = run.bosses.includes("Rathael the Reborn");
    if (!hasRath) continue;

    let player = run.discorduser;
    if (!player || player === "" || player === null || player === undefined) {
      // player = "anonymous";
      continue;
    }

    // player = player.toLowerCase().trim();
    player = player_aliases[player] || player;

    rathKills[player] = (rathKills[player] || 0) + 1;
  }

  return rathKills;
}

function generateHtml(rathKills, difficulty) {
  // Sort players by kill count (descending)
  const sortedPlayers = Object.entries(rathKills)
    .sort((a, b) => b[1] - a[1])
    .map(([player, kills]) => ({ player, kills }));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚔️ Rath Reborn Kills by Player</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #1a1a1a;
      color: #ffffff;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      color: #ffffff;
    }
    .chart-container {
      position: relative;
      height: ${Math.max(600, sortedPlayers.length * 25)}px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚔️ Rath Reborn Kills (${difficulty})</h1>
    <div class="chart-container">
      <canvas id="rathChart"></canvas>
    </div>
  </div>

  <script>
    const data = ${JSON.stringify(sortedPlayers)};

    // Register the datalabels plugin
    Chart.register(ChartDataLabels);

    const ctx = document.getElementById('rathChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.player),
        datasets: [{
          label: '',
          data: data.map(d => d.kills),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            right: 60
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#ffffff'
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#ffffff',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value) => value
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff',
              stepSize: 1
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync("rath_kills.html", html);
}

async function main() {
  const shouldFetch = process.argv.includes("--fetch");

  // Parse difficulty from command line args
  const diffIndex = process.argv.indexOf("--diff");
  const diffArg = diffIndex !== -1 ? process.argv[diffIndex + 1] : null;
  const difficulty = parseDifficulty(diffArg);

  console.log(`Using difficulty: ${difficulty}`);

  if (shouldFetch) {
    console.log("\nFetching speedrun data...");
    await fetchAllRuns(difficulty);
    console.log("Data fetched! 💾\n");
  }

  console.log("Reading runs from cached files...");
  const runs = readRunsFromFiles(difficulty);

  if (!runs || runs.length === 0) {
    console.error("No runs found! Run with --fetch to fetch new data.");
    process.exit(1);
  }

  console.log(`Total runs loaded: ${runs.length}`);

  console.log("\nCounting Rathael kills per player...");
  const rathKills = countRathKillsByPlayer(runs);

  const totalKills = Object.values(rathKills).reduce(
    (sum, kills) => sum + kills,
    0,
  );
  const uniquePlayers = Object.keys(rathKills).length;

  console.log(`Total Rathael kills: ${totalKills}`);
  console.log(`Unique players with Rathael kills: ${uniquePlayers}`);

  console.log("\nGenerating chart...");
  generateHtml(rathKills, difficulty);
  console.log("Chart generated! 📊");
  console.log("\nOpen rath_kills.html in your browser to view the chart.");
}

main();
