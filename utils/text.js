const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

// - - - - - - - Search - - - - - - -

function getKeywords(searchTerms) {
  const pattern = /,|\s+or\s+/;
  return searchTerms
    .join(" ")
    .split(pattern)
    .map((keyword) => keyword.trim());
}

// - - - - - - Formatting - - - - - -

function bold(str) {
  return `${BOLD}${str}${RESET}`;
}

// - - - - - - - Colors - - - - - - -

function green(str) {
  return `\x1b[32m${str}${RESET}`;
}

function blue(str) {
  return `\x1b[38;5;39m${str}${RESET}`;
}

function red(str) {
  return `\x1b[31m${str}${RESET}`;
}

function purple(str) {
  return `\x1b[38;5;129m${str}${RESET}`;
}

function brown(str) {
  return `\x1b[38;5;94m${str}${RESET}`;
}

function aqua(str) {
  return `\x1b[38;5;14m${str}${RESET}`;
}

function white(str) {
  return `\x1b[37m${str}${RESET}`;
}

function gold(str) {
  return `\x1b[38;5;220m${str}${RESET}`;
}

function black(str) {
  return `\x1b[30m${str}${RESET}`;
}

function orange(str) {
  return `\x1b[38;5;208m${str}${RESET}`;
}

function dark_red(str) {
  return `\x1b[38;5;124m${str}${RESET}`;
}

module.exports = {
  bold,
  colors: {
    green,
    blue,
    red,
    purple,
    brown,
    aqua,
    white,
    gold,
    black,
    orange,
    dark_red,
  },
  getKeywords,
};
