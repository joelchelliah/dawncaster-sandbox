const { colors } = require("./text");

function getColor(card) {
  const dot = `●`;

  switch (card.color) {
    case 1:
      return colors.green(dot);
    case 2:
      return colors.blue(dot);
    case 3:
      return colors.red(dot);
    case 4:
      return colors.purple(dot);
    case 5:
      return colors.brown(dot);
    case 6:
      return colors.aqua(dot);
    case 7:
      return colors.white(dot);
    case 8:
      return colors.gold(dot);
    case 9:
      return colors.black(dot);
    case 10:
      return colors.orange(dot);
    case 11:
      return colors.dark_red(dot);
    default:
      return colors.white(`UNDEF (${card.color})`);
  }
}

function getColorName(card) {
  switch (card.color) {
    case 1:
      return "Green";
    case 2:
      return "Blue";
    case 3:
      return "Red";
    case 4:
      return "Purple";
    case 5:
      return "Brown";
    case 6:
      return "Aqua";
    case 7:
      return "White";
    case 8:
      return "Gold";
    case 9:
      return "Black";
    case 10:
      return "Orange";
    case 11:
      return "Monster";
    default:
      return `UNDEF (${card.color})`;
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

module.exports = {
  getColor,
  getColorName,
  getExpansion,
  getRarity,
};
