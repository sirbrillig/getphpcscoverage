const { get, some } = require('lodash')
const fs = require('fs')
const fsPath = require('path')
const readPath = require('recursive-readdir')
const xml2js = require('xml2js')
const {humanReport, jsonReport} = require('./reporters')

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
          const files = get(result, 'ruleset.file', [])
          const paths = prependPathToPaths(fsPath.dirname(xmlFilePath), files)
          resolve(paths)
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

function doesPathMatchPrefixes (prefixes, path) {
  return some(prefixes, parentPath => path.startsWith(parentPath))
}

function filterByParentPaths (parentPaths, paths) {
  return paths.filter(path => doesPathMatchPrefixes(parentPaths, path))
}

function filterWithoutParentPaths (parentPaths, paths) {
  return paths.filter(path => !doesPathMatchPrefixes(parentPaths, path))
}

function doesPathMatchPatterns (patterns, path) {
  return some(patterns, pattern => path.match(pattern))
}

function filterByPatterns (patterns, paths) {
  return paths.filter(path => doesPathMatchPatterns(patterns, path))
}

function filterWithoutPatterns (patterns, paths) {
  return paths.filter(path => !doesPathMatchPatterns(patterns, path))
}

function getDirectoryScanner ({getFilesFromXml, getFilesFromPath, patterns}) {
  if (patterns) {
    return function scanDirectoryForPatterns (directoryPath, options) {
      return getFilesFromPath(directoryPath, options)
        .then(results => {
          const files = filterByFileType(options.type || 'php', results)
          const found = filterByPatterns(patterns, files)
          const notFound = filterWithoutPatterns(patterns, files)
          return {found, notFound}
        })
    }
  }
  return function scanDirectory (directoryPath, options) {
    const phpcsXmlPath = fsPath.join(directoryPath, 'phpcs.xml')
    return Promise.all([getFilesFromPath(directoryPath, options), getFilesFromXml(phpcsXmlPath)])
      .then(results => {
        const files = filterByFileType(options.type || 'php', results[0])
        const paths = results[1]
        const found = filterByParentPaths(paths, files)
        const notFound = filterWithoutParentPaths(paths, files)
        return {found, notFound}
      })
  }
}

function performScanWithPaths (targetDir, flags) {
  const parser = new xml2js.Parser()
  const getFilesFromXml = getXmlReader({readFile: fs.readFile, parseXmlString: parser.parseString})
  const getFilesFromPath = getPathReader({readFilesFromPath: readPath})
  const scanDirectory = getDirectoryScanner({getFilesFromXml, getFilesFromPath})
  performScan(targetDir, scanDirectory, flags)
}

function performScanWithPatterns (targetDir, flags, patterns) {
  const getFilesFromPath = getPathReader({readFilesFromPath: readPath})
  const scanDirectory = getDirectoryScanner({patterns, getFilesFromPath})
  performScan(targetDir, scanDirectory, flags)
}

function performScan (targetDir, scanDirectory, flags) {
  scanDirectory(targetDir, flags)
    .then(({found, notFound}) => {
      switch (flags.format) {
        case 'human':
          return humanReport(found, notFound)
        case 'json':
          return jsonReport(found, notFound)
      }
      throw new Error(`Unknown format: ${flags.format}`)
    })
    .catch(err => {
      console.error(`An error occurred while scanning the directory ${targetDir}:`)
      console.error(err)
    })
}

function getDataFromStdin () {
  return new Promise((resolve) => {
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
      resolve(data)
    })
  })
}

module.exports = {
  getDataFromStdin,
  performScanWithPaths,
  performScanWithPatterns,
  getDirectoryScanner,
  getXmlReader,
  getPathReader
}
