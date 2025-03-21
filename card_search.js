const axios = require("axios");
const fs = require("fs");

const {
  getExpansion,
  getRarity,
  getColor,
  getColorName,
} = require("./utils/card");
const { bold, getKeywords } = require("./utils/text");
const { createDir } = require("./utils/file");

const dirName = "data";
const fileName = `${dirName}/cards.json`;

async function fetchCards() {
  const numExpansions = 8;
  const numBanners = 12;
  const aggregatedCards = [];

  console.log("\nFetching cards...");

  for (let exp = 0; exp < numExpansions; exp++) {
    for (let banner = 0; banner < numBanners; banner++) {
      // Too many monster cards. SKIPPING...
      if (exp == 0 && banner == 11) continue;

      const url = `https://blightbane.io/api/cards?search=&rarity=&category=&type=&banner=${banner}&exp=${exp}`;
      try {
        const response = await axios.get(url);
        const { card_len, cards } = response.data;

        if (card_len > 100) {
          throw new Error(`Too many cards! Banner: ${banner}, Exp: ${exp}`);
        }

        const output = cards.map((card) => ({
          name: card.name,
          description: card.description,
          rarity: card.rarity,
          type: card.type,
          category: card.category,
          expansion: card.expansion,
          color: card.color,
        }));

        aggregatedCards.push(...output);
      } catch (error) {
        console.error(
          `Error fetching data for banner: ${banner}, exp: ${exp}`,
          error
        );
      }
    }
  }

  console.log(`Fetched data for ${aggregatedCards.length} cards`);

  createDir(dirName);
  fs.writeFileSync(fileName, JSON.stringify(aggregatedCards, null, 2));
  console.log(`Cards data saved to ${fileName} 💾`);
}

function searchCards(
  keywords,
  excludedExpansions,
  excludedRarities,
  excludedCards
) {
  // Skip summons, performance, form, hymn, affixes, attunements, ingredients
  const excludedCategories = [3, 6, 7, 8, 9, 12, 13, 16];

  try {
    const results = JSON.parse(fs.readFileSync(fileName, "utf8"))
      .filter(({ category }) => !excludedCategories.includes(category))
      .filter(({ expansion }) => !excludedExpansions.includes(expansion))
      .filter(({ rarity }) => !excludedRarities.includes(rarity))
      .filter(
        ({ name }) =>
          !excludedCards.some(
            (excludedCard) => excludedCard.toLowerCase() === name.toLowerCase()
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
        if (a.color !== b.color) {
          return a.color - b.color;
        }
        return b.rarity - a.rarity;
      });

    return results.map((card) => ({
      name: card.name,
      category: card.category,
      description: card.description,
      color: getColor(card),
      colorName: getColorName(card),
      rarity: getRarity(card),
      expansion: getExpansion(card),
    }));
  } catch (error) {
    return null;
  }
}

function printCards(cards, verbose = false) {
  const MIN_NAME_WIDTH = 22;
  const HORIZONTAL_LINE = "_ ".repeat(MIN_NAME_WIDTH);

  console.log(HORIZONTAL_LINE);
  cards.forEach((card, index) => {
    const extraTags = card.category == 11 ? "(Revelation)" : "";
    const visibleStr = `${card.color} ${card.name}`.replace(
      /\x1b\[[0-9;]*m/g,
      ""
    );
    const padding = " ".repeat(Math.max(0, MIN_NAME_WIDTH - visibleStr.length));
    const colorAndName = `${card.color} ${card.name} ${padding}`;

    if (index > 0 && card.color != cards[index - 1].color) {
      console.log(HORIZONTAL_LINE);
    }

    console.log(
      `\n${colorAndName} ${card.rarity} [${card.expansion}] ${extraTags}`
    );
    if (verbose) {
      console.log(card.description);
      console.log("");
    }
  });
}

function printCardsShort(cards) {
  cards.forEach((card, index) => {
    if (index === 0 || (index > 0 && card.color != cards[index - 1].color)) {
      console.log(`${card.colorName}`);
    }
    console.log(`${card.rarity} ${card.name}`);
  });
}

function printUsage() {
  console.error("🤨 Please provide search terms!");
  console.error("Usage:");
  console.error("  node card_search.js [search terms] [options]");
  console.error("");
  console.error("Options:");
  console.error("  --f           Fetch latest card data");
  console.error("  --s           Display cards in a compact format");
  console.error(
    "  --e<nums>     Exclude expansions (e.g., --e567 excludes Infinitum, Catalyst & Eclypse)"
  );
  console.error(
    "  --r<nums>     Exclude rarities (e.g., --r01 excludes Common and Uncommon)"
  );
  console.error("");
  console.error("Expansion numbers:");
  console.error("  1: Core");
  console.error("  2: Metaprogression");
  console.error("  3: Metamorphosis");
  console.error("  4: Core Extended");
  console.error("  5: Infinitum");
  console.error("  6: Catalyst");
  console.error("  7: Eclypse");
  console.error("");
  console.error("Rarity numbers:");
  console.error("  0: Common");
  console.error("  1: Uncommon");
  console.error("  2: Rare");
  console.error("  3: Legendary");
  console.error("");
  console.error("Examples:");
  console.error(
    "  node card_search.js fire                  # All expansions except 0"
  );
  console.error(
    "  node card_search.js legendary --e56       # Exclude Infinitum & Catalyst"
  );
  console.error(
    "  node card_search.js burn --r01            # Exclude Common and Uncommon"
  );
  console.error(
    "  node card_search.js dragon --s --r23      # Exclude Rare and Legendary, short format"
  );
}

async function main() {
  const args = process.argv.slice(2);

  // Check for various flag combinations
  const hasFetchFlag = args.some((arg) => arg === "--f");
  const hasShortFlag = args.some((arg) => arg === "--s");
  const hasCombinedFlag = args.some((arg) => arg === "--sf" || arg === "--fs");

  const shouldFetch = hasFetchFlag || hasCombinedFlag;
  const shouldPrintShort = hasShortFlag || hasCombinedFlag;

  // Expansion flags
  // --e124 means exclude expansions 1, 2, and 4
  const expansionFlag = args.find((arg) => /^--e\d+$/.test(arg));
  let explicitlyExcludedExpansions = [];

  if (expansionFlag) {
    // Extract all individual digits from the flag (e.g., --e124 -> [1,2,4])
    const expansionDigits = expansionFlag
      .substring(3)
      .split("")
      .map((digit) => parseInt(digit));
    explicitlyExcludedExpansions = expansionDigits;
  }

  const excludedExpansions = [
    0, // Conjured cards excluded by default
    ...explicitlyExcludedExpansions,
  ].filter((exp, index, self) => self.indexOf(exp) === index);

  // Rarity flags
  // --r01 means exclude rarities 0 and 1
  const rarityFlag = args.find((arg) => /^--r\d+$/.test(arg));
  let excludedRarities = [];

  if (rarityFlag) {
    // Extract all individual digits from the flag (e.g., --r01 -> [0,1])
    const rarityDigits = rarityFlag
      .substring(3)
      .split("")
      .map((digit) => parseInt(digit));
    excludedRarities = rarityDigits;
  }

  // Filter out duplicate rarities
  excludedRarities = excludedRarities.filter(
    (rarity, index, self) => self.indexOf(rarity) === index
  );

  // Filter out all flag variations for search terms
  const searchTerms = args.filter((arg) => !arg.startsWith("--"));

  if (shouldFetch) {
    await fetchCards();
  }

  if (searchTerms.length === 0) {
    printUsage();
    process.exit(1);
  }

  const excludedCards = [];

  const keywords = getKeywords(searchTerms);
  const cards = searchCards(
    keywords,
    excludedExpansions,
    excludedRarities,
    excludedCards
  );

  if (!cards) {
    console.error("No cards file found! Run with --fetch to fetch new data.");
    process.exit(1);
  }

  console.log(
    `🎴 ${bold(cards.length)} cards matching: [ ${keywords.join(", ")} ]`
  );

  console.log(
    `Excluded expansions:  [ ${excludedExpansions
      .map((exp) => expansionsMap[exp])
      .join(", ")} ]`
  );
  console.log(
    `Excluded rarities:    [ ${excludedRarities
      .map((rarity) => raritiesMap[rarity])
      .join(", ")} ]`
  );

  if (shouldPrintShort) {
    printCardsShort(cards);
  } else {
    printCards(cards, false);
  }
}

const expansionsMap = {
  0: "Conjured/Misc",
  1: "Core",
  2: "Metaprogression",
  3: "Metamorphosis",
  4: "Core Extended",
  5: "Infinitum",
  6: "Catalyst",
  7: "Eclypse",
};

const raritiesMap = {
  0: "Common",
  1: "Uncommon",
  2: "Rare",
  3: "Legendary",
};

main();
