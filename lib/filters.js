const { some } = require('lodash')

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

module.exports = {
  filterWithoutParentPaths,
  filterByParentPaths,
  filterByFileType,
  filterByPatterns,
  filterWithoutPatterns
}
