const axios = require("axios");
const fs = require("fs");

const { bold, getKeywords } = require("./utils/text");
const { createDir } = require("./utils/file");
const {
  getExpansion,
  printCards,
  getRarity,
  getColor,
} = require("./utils/card");

const dirName = "data";
const fileName = `${dirName}/talents.json`;

async function fetchTalents() {
  const numTiers = 6;
  const aggregatedTalents = [];

  console.log("\nFetching talents...");

  for (let tier = 0; tier < numTiers; tier++) {
    const url = `https://blightbane.io/api/cards?search=&rarity=${tier}&category=10&type=&banner=&exp=`;

    try {
      const response = await axios.get(url);
      const { card_len, cards: talents } = response.data;

      if (card_len > 100) {
        throw new Error(`Too many talents! Tier: ${tier}`);
      }

      const output = talents.map((talent) => ({
        name: talent.name,
        description: talent.description,
        rarity: talent.rarity,
        type: talent.type,
        category: talent.category,
        expansion: talent.expansion,
        color: talent.color,
        hasEvents: talent.hasEvents,
      }));

      aggregatedTalents.push(...output);
    } catch (error) {
      console.error(`Error fetching data for tier: ${tier}`, error);
    }
  }

  createDir(dirName);
  fs.writeFileSync(fileName, JSON.stringify(aggregatedTalents, null, 2));
  console.log(`Talents data saved to ${fileName} 💾`);
}

function searchTalents(
  keywords,
  excludedExpansions,
  excludedRarities,
  excludedTalents
) {
  const excludedCategories = [];
  try {
    const results = JSON.parse(fs.readFileSync(fileName, "utf8"))
      .filter(({ category }) => !excludedCategories.includes(category))
      .filter(({ expansion }) => !excludedExpansions.includes(expansion))
      .filter(({ rarity }) => !excludedRarities.includes(rarity))
      .filter(
        ({ name }) =>
          !excludedTalents.some(
            (excluded) => excluded.toLowerCase() === name.toLowerCase()
          )
      )
      .filter(({ name, description }) =>
        keywords.some(
          (key) =>
            name.toLowerCase().includes(key.toLowerCase()) ||
            description.toLowerCase().includes(key.toLowerCase())
        )
      )
      .sort((a, b) => {
        return a.rarity - b.rarity;
      });

    return results.map((talent) => ({
      name: talent.name,
      category: talent.category,
      description: talent.description,
      color: getColor(talent),
      rarity: talent.rarity,
      expansion: getExpansion(talent),
      hasEvents: talent.hasEvents,
    }));
  } catch (error) {
    console.error("Error searching talents", error);
    return null;
  }
}

function printTalents(talents, verbose = false) {
  const MIN_NAME_WIDTH = 32;
  const HORIZONTAL_LINE = "_ ".repeat((MIN_NAME_WIDTH * 2) / 3);

  console.log(HORIZONTAL_LINE);
  talents.forEach((talent, index) => {
    const extraTags = talent.category == 11 ? "(Revelation)" : "";
    const visibleStr = `${talent.color} ${talent.name}`.replace(
      /\x1b\[[0-9;]*m/g,
      ""
    );
    const padding = " ".repeat(Math.max(0, MIN_NAME_WIDTH - visibleStr.length));
    const paddedName = `${talent.name} ${padding}`;
    const eventMarker = talent.hasEvents ? "🚩" : "";

    if (index > 0 && talent.rarity != talents[index - 1].rarity) {
      console.log(HORIZONTAL_LINE);
    }

    console.log(
      `\n${talent.rarity} - ${paddedName} [${talent.expansion}] ${extraTags} ${eventMarker}`
    );
    if (verbose) {
      console.log(talent.description);
      console.log("");
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFetch = args.includes("--fetch");
  const searchTerms = args.filter((arg) => arg !== "--fetch");

  if (shouldFetch) {
    await fetchTalents();
  }

  const excludedExpansions = [
    // 0, // Conjured cards, side effects, etc...
    // 1, // Core
    // 2, // Metaprogression
    // 3, // Metamorphosis
    // 4, // Core extended
    // 5, // Infinitum
    // 6, // Catalyst
    // 7, // Eclypse
  ];

  const excludedRarities = [
    // 0, // Common
    // 1, // Uncommon
    // 2, // Rare
    // 3, // Legendary
  ];

  const excludedTalents = [];

  const keywords = searchTerms.length > 0 ? getKeywords(searchTerms) : [""];
  const talents = searchTalents(
    keywords,
    excludedExpansions,
    excludedRarities,
    excludedTalents
  );

  if (!talents) {
    console.error("No talents file found! Run with --fetch to fetch new data.");
    process.exit(1);
  }

  console.log(
    `🎴 Found ${bold(talents.length)} talents matching:\n   [ ${keywords.join(
      ", "
    )} ]`
  );

  printTalents(talents, false);
}

main();
