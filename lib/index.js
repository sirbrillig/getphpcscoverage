const { get, some } = require('lodash')
const fsPath = require('path')

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

function filterByParentPaths (parentPaths, paths) {
  return paths.filter(file => some(parentPaths, parentPath => file.startsWith(parentPath)))
}

function filterByPatterns (patterns, paths) {
  return paths.filter(file => some(patterns, pattern => file.match(pattern)))
}

function filterWithoutPatterns (patterns, paths) {
  return paths.filter(file => !some(patterns, pattern => file.match(pattern)))
}

function filterWithoutParentPaths (parentPaths, paths) {
  return paths.filter(file => !some(parentPaths, parentPath => file.startsWith(parentPath)))
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

module.exports = {
  getDirectoryScanner,
  getXmlReader,
  getPathReader
}
