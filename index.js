#!/usr/bin/env node

const readPath = require('recursive-readdir')
const xml2js = require('xml2js')
const fs = require('fs')
const { get, some } = require('lodash')
const fsPath = require('path')
const meow = require('meow')

const parser = new xml2js.Parser()
const cli = meow(`
  Usage
    $ getphpcscoverage [directoryPath]

  Specify a directory path which contains a phpcs.xml config file. This will
  report the files which will be scanned by the config file and those that will
  not.

  Options
    --help, -h  Show this help message
    --version, -v  Show the version
    --type <type>, -t <type>  Only examine files with this type extension (php, js, etc.)
    --format <format>, -f <format>  Set output type (human, json)
    --ignore <pattern>, -i <pattern>  Ignore files matching this pattern
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

function getXmlReader ({readFile, parseXmlString}) {
  return function getFilesFromXml (xmlFilePath) {
    return new Promise((resolve, reject) => {
      readFile(xmlFilePath, (err, data) => {
        if (err) {
          return reject(err)
        }
        parseXmlString(data, (err, result) => {
          if (err) {
            return reject(err)
          }
          resolve(get(result, 'ruleset.file', []))
        })
      })
    })
  }
}

function getPathReader ({readFilesFromPath}) {
  return function getFilesFromPath (directoryPath, options) {
    const ignoreFiles = options.ignore ? [ `*${options.ignore}*` ] : []
    return readFilesFromPath(directoryPath, ignoreFiles)
  }
}

function prependPathToPaths (prepend, paths) {
  return paths.map(path => fsPath.join(prepend, path))
}

function filterByFileType (type, paths) {
  return paths.filter(path => path.endsWith(type))
}

function filterByParentPaths (parentPaths, paths) {
  return paths.filter(file => some(parentPaths, parentPath => file.startsWith(parentPath)))
}

function filterWithoutParentPaths (parentPaths, paths) {
  return paths.filter(file => !some(parentPaths, parentPath => file.startsWith(parentPath)))
}

function humanReport (found, notFound) {
  console.log('These files WILL be scanned by phpcs:')
  found.map(file => console.log(file))
  console.log('')
  console.log('These files WILL NOT be scanned by phpcs:')
  notFound.map(file => console.log(file))
  const percent = getPercent(found, notFound)
  console.log('')
  console.log(`That's a coverage of ${percent}%`)
}

function jsonReport (found, notFound) {
  const percent = getPercent(found, notFound)
  console.log(JSON.stringify({found, notFound, percent}))
}

function getPercent (found, notFound) {
  const totalCount = found.length + notFound.length
  return Number.parseInt((found.length / totalCount) * 100, 10)
}

function scanDirectory (directoryPath, options) {
  const phpcsXmlPath = fsPath.join(directoryPath, 'phpcs.xml')
  const getFilesFromXml = getXmlReader({readFile: fs.readFile, parseXmlString: parser.parseString})
  const getFilesFromPath = getPathReader({readPath})
  return Promise.all([getFilesFromPath(directoryPath, options), getFilesFromXml(phpcsXmlPath)])
    .then(results => {
      const files = filterByFileType(options.type, results[0])
      const paths = prependPathToPaths(fsPath.dirname(phpcsXmlPath), results[1])
      const found = filterByParentPaths(paths, files)
      const notFound = filterWithoutParentPaths(paths, files)
      return {found, notFound}
    })
}
