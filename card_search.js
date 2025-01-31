const axios = require("axios");
const fs = require("fs");

const { getExpansion, getRarity, getColor } = require("./utils/card");
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

async function main() {
  const args = process.argv.slice(2);
  const shouldFetch = args.includes("--fetch");
  const searchTerms = args.filter((arg) => arg !== "--fetch");

  if (shouldFetch) {
    await fetchCards();
  }

  if (searchTerms.length === 0) {
    console.error("🤨 Please provide search terms!");
    process.exit(1);
  }

  const excludedExpansions = [
    0, // Conjured cards, side effects, etc...
    // 1, // Core
    // 2, // Metaprogression
    // 3, // Metamorphosis
    // 4, // Core extended
    5, // Infinitum
    6, // Catalyst
    // 7, // Eclypse
  ];

  const excludedRarities = [
    0, // Common
    1, // Uncommon
    // 2, // Rare
    // 3, // Legendary
  ];

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
    `🎴 Found ${bold(cards.length)} cards matching:\n   [ ${keywords.join(
      ", "
    )} ]`
  );

  printCards(cards, false);
}

main();
