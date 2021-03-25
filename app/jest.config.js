module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePaths: [
    "<rootDir>"
  ],
  moduleFileExtensions: [
    "js",
    "ts",
    "json",
    "vue"
  ],
  transform: {
    // process TypeScript files
    "^.+\\.ts$": "ts-jest",
    // process *.vue files with vue-jest
    ".*\\.(vue)$": "vue-jest"
  },
  // support the same @ -> src alias mapping in source code
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  testEnvironment: "jsdom"
};