const axios = require("axios");
const fs = require("fs");

const numExpansions = 8;
const numBanners = 12;

async function fetchCards() {
  console.log("Fetching card data...");
  const aggregatedCards = [];

  for (let exp = 0; exp < numExpansions; exp++) {
    for (let banner = 0; banner < numBanners; banner++) {
      // Too many monster cards. SKIPPING
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

  fs.writeFileSync("data/cards.json", JSON.stringify(aggregatedCards, null, 2));
  console.log("Cards data saved to cards.json");
}

fetchCards();
