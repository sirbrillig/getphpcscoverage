#!/usr/bin/env node

const readPath = require('recursive-readdir')
const xml2js = require('xml2js')
const fs = require('fs')
const {getXmlReader, getPathReader, getDirectoryScanner} = require('./lib/index')
const {humanReport, jsonReport} = require('./lib/reporters')
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
    --format <format>, -f <format>  Set output type (human, json)
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
const parser = new xml2js.Parser()
if (!process.stdin.isTTY) {
  let data = ''
  process.stdin.setEncoding('utf-8')
  process.stdin.on('readable', () => {
    let chunk = process.stdin.read()
    while (chunk) {
      data += chunk
      chunk = process.stdin.read()
    }
  })
  process.stdin.on('end', () => {
    data = data.replace(/\n$/, '')
    const patterns = JSON.parse(data)
    const getFilesFromPath = getPathReader({readFilesFromPath: readPath})
    const scanDirectory = getDirectoryScanner({patterns, getFilesFromPath})
    scanDirectory(targetDir, cli.flags)
      .then(({found, notFound}) => {
        switch (cli.flags.format) {
          case 'human':
            return humanReport(found, notFound)
          case 'json':
            return jsonReport(found, notFound)
        }
        throw new Error(`Unknown format: ${cli.flags.format}`)
      })
      .catch(err => {
        console.error(`An error occurred while scanning the directory ${targetDir}:`)
        console.error(err)
      })
  })
} else {
  if (cli.flags.patterns) {
    const patterns = JSON.parse(cli.flags.patterns)
    const getFilesFromPath = getPathReader({readFilesFromPath: readPath})
    const scanDirectory = getDirectoryScanner({patterns, getFilesFromPath})
    scanDirectory(targetDir, cli.flags)
      .then(({found, notFound}) => {
        switch (cli.flags.format) {
          case 'human':
            return humanReport(found, notFound)
          case 'json':
            return jsonReport(found, notFound)
        }
        throw new Error(`Unknown format: ${cli.flags.format}`)
      })
      .catch(err => {
        console.error(`An error occurred while scanning the directory ${targetDir}:`)
        console.error(err)
      })
  } else {
    const getFilesFromXml = getXmlReader({readFile: fs.readFile, parseXmlString: parser.parseString})
    const getFilesFromPath = getPathReader({readFilesFromPath: readPath})
    const scanDirectory = getDirectoryScanner({getFilesFromXml, getFilesFromPath})
    scanDirectory(targetDir, cli.flags)
      .then(({found, notFound}) => {
        switch (cli.flags.format) {
          case 'human':
            return humanReport(found, notFound)
          case 'json':
            return jsonReport(found, notFound)
        }
        throw new Error(`Unknown format: ${cli.flags.format}`)
      })
      .catch(err => {
        console.error(`An error occurred while scanning the directory ${targetDir}:`)
        console.error(err)
      })
  }
}
