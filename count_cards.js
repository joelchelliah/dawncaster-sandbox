const fs = require("fs");
const { bold } = require("./utils/formatting");

const allCards = JSON.parse(fs.readFileSync("data/cards.json", "utf8"));

console.log("Number of cards: ", bold(allCards.length));
