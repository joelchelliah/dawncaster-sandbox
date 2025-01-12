const fs = require("fs");

const file = "data/cards.json";
const allCards = JSON.parse(fs.readFileSync(file, "utf8"));

function searchCards(
  keywords,
  excludedExpansions,
  excludedRarities,
  excludedCards
) {
  // Skip summons, performance, form, hymn, affixes, attunements, ingredients
  const blacklistedCategories = [3, 6, 7, 8, 9, 12, 13, 16];
  const blacklistedExpansions = [0, ...excludedExpansions];
  const results = allCards
    .filter(({ category }) => !blacklistedCategories.includes(category))
    .filter(({ expansion }) => !blacklistedExpansions.includes(expansion))
    .filter(({ rarity }) => !excludedRarities.includes(rarity))
    .filter(
      ({ name }) =>
        !excludedCards.some(
          (excludedCard) => excludedCard.toLowerCase() === name.toLowerCase()
        )
    )
    .filter((card) =>
      keywords.some(
        (key) =>
          card.name.toLowerCase().includes(key.toLowerCase()) ||
          card.description.toLowerCase().includes(key.toLowerCase())
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
}

function bold(str) {
  return `\x1b[1m${str}\x1b[0m`;
}

function getColor(card) {
  const reset = "\x1b[0m";
  const dot = `●${reset}`;

  switch (card.color) {
    case 1:
      return `\x1b[32m${dot}`;
    case 2:
      return `\x1b[38;5;39m${dot}`;
    case 3:
      return `\x1b[31m${dot}`;
    case 4:
      return `\x1b[38;5;129m${dot}`;
    case 5:
      return `\x1b[38;5;94m${dot}`;
    case 6:
      return `\x1b[38;5;14m${dot}`;
    case 7:
      return `\x1b[37m${dot}`;
    case 8:
      return `\x1b[38;5;220m${dot}`;
    case 9:
      return `\x1b[30m${dot}`;
    case 10:
      return `\x1b[38;5;208m${dot}`;
    case 11:
      return `\x1b[38;5;124m${dot}`;
    default:
      return `\x1b[37mUNDEF (${card.color})${reset}`;
  }
}

function getRarity(card) {
  switch (card.rarity) {
    case 0:
      return "🩶";
    case 1:
      return "💚";
    case 2:
      return "🩵";
    case 3:
      return "🤩";
    default:
      return "UNKNOWN";
  }
}

function getExpansion(card) {
  switch (card.expansion) {
    case 1:
      return "Core";
    case 2:
      return "Metaprogression";
    case 3:
      return "Metamorphosis";
    case 4:
      return "Core Extended";
    case 5:
      return "Infinitum";
    case 6:
      return "Catalyst";
    case 7:
      return "Eclypse";
    default:
      return "UNKNOWN";
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

/**
 * Expansions
 * 1 - Core
 * 2 - Metaprogression
 * 3 - Metamorphosis
 * 4 - Core extended
 * 5 - Infinitum
 * 6 - Catalyst
 * 7 - Eclypse
 */
const excludedExpansions = [];

/**
 * Rarities
 * 0 - Common
 * 1 - Uncommon
 * 2 - Rare
 * 3 - Legendary
 */
const excludedRarities = [0];

const excludedCards = [
  "Ritual Contract",
  "Mystic Contract",
  "Feral Weapon",
  "Daring Contract",
  "Cunning Contract",
  "Crimson Contract",
  "Crafty Contract",
  "Treaty of Joy",
  "Encore!",
  "Elite Prayer",
  "Alchemic Presence",
  "Way of the Wise",
  "Demon Claws",
  "Celestial Claws",
  "Elite fireball",
  "Elite frostbolt",
  "Elite lightning bolt",
  "Soulfire Bomb",
];

const input = process.argv[2];
const pattern = /,|\s+or\s+/;
const keywords = input.split(pattern).map((keyword) => keyword.trim());

const cards = searchCards(
  keywords,
  excludedExpansions,
  excludedRarities,
  excludedCards
);

console.log(
  `🎴 Found ${bold(cards.length)} cards matching:\n   [ ${keywords.join(
    ", "
  )} ]`
);

printCards(cards, false);
