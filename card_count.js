const fs = require("fs");
const { bold } = require("./utils/formatting");

const dirName = "data";
const fileName = `${dirName}/cards.json`;

const allCards = JSON.parse(fs.readFileSync(fileName, "utf8"));

console.log("Number of cards: ", bold(allCards.length));
