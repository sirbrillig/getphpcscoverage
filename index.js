#!/usr/bin/env node

const {
  getDataFromStdin,
  performScanWithPatterns,
  performScanWithPaths
} = require('./lib/index')
const meow = require('meow')

const cli = meow(`
  Usage
    $ getphpcscoverage [directoryPath]

  Specify a directory path which contains a phpcs.xml config file. This will
  report the files which will be scanned by the config file and those that will
  not.

  If --patterns is used, those patterns will be used instead of the paths in
  the phpcs.xml file.

  If you pipe input to getphpcscoverage it will be assumed to be patterns in
  which case it is not necessary to use the --patterns option.

  Options
    --help, -h  Show this help message
    --version, -v  Show the version
    --type <type>, -t <type>  Only examine files with this type extension (defaults to php)
    --format <format>, -f <format>  Set output type (human, json, percent)
    --ignore <pattern>, -i <pattern>  Ignore files matching this pattern
    --patterns <patterns> Report on files matching any of the patterns (which should be a JSON list)
`, {
  flags: {
    version: {
      type: 'boolean',
      alias: 'v',
      default: false
    },
    help: {
      type: 'boolean',
      alias: 'h',
      default: false
    },
    type: {
      type: 'string',
      alias: 't',
      default: 'php'
    },
    format: {
      type: 'string',
      alias: 'f',
      default: 'human'
    },
    patterns: {
      type: 'string'
    },
    ignore: {
      type: 'string',
      alias: 'i',
      default: ''
    }
  }
})

if (cli.flags.help) {
  cli.showHelp()
  // showHelp automatically exits
}
if (cli.flags.version) {
  cli.showVersion()
  // showVersion automatically exits
}

const targetDir = cli.input[0] || '.'
if (!process.stdin.isTTY) {
  getDataFromStdin()
    .then(data => performScanWithPatterns(targetDir, cli.flags, JSON.parse(data)))
} else if (cli.flags.patterns) {
  performScanWithPatterns(targetDir, cli.flags, JSON.parse(cli.flags.patterns))
} else {
  performScanWithPaths(targetDir, cli.flags)
}
