#!/usr/bin/env node

const pathReader = require('path-reader')
const xml2js = require('xml2js')
const fs = require('fs')
const { get, some } = require('lodash')
const fsPath = require('path')

const parser = new xml2js.Parser()

const directoryPath = 'testdir'
const phpcsXmlPath = 'testdir/phpcs.xml'
const fileType = 'js'

function getFilesFromXml (xmlFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(xmlFilePath, (err, data) => {
      if (err) {
        return reject(err)
      }
      parser.parseString(data, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(get(result, 'ruleset.file', []))
      })
    })
  })
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

Promise.all([pathReader.promiseFiles(directoryPath), getFilesFromXml(phpcsXmlPath)])
  .then(results => {
    const files = filterByFileType(fileType, results[0])
    const paths = prependPathToPaths(fsPath.dirname(phpcsXmlPath), results[1])
    const found = filterByParentPaths(paths, files)
    const notFound = filterWithoutParentPaths(paths, files)
    console.log('found these:')
    console.log(found)
    console.log('did not find these:')
    console.log(notFound)
  })
  .catch(err => {
    console.error(err)
  })
