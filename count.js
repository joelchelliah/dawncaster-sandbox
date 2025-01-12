const fs = require("fs");

const allCards = JSON.parse(fs.readFileSync("data/cards.json", "utf8"));

console.log("Number of cards: ", allCards.length);
