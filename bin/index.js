#!/usr/bin/env node
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const generate = require("../lib/prisma/generate");

yargs(hideBin(process.argv))
  .command(
    "generate",
    "Generate table mapper to use in blueprint",
    {
      exclude: {
        desc: "List of tables names to exclude",
        array: true,
        string: true,
        demandOption: false,
      },
    },
    (argv) => {
      const exclude =
        typeof argv.exclude === "undefined" ? undefined : new Set(argv.exclude);
      generate.build(path.resolve("."), exclude);
    }
  )
  .help()
  .alias("help", "h").argv;
