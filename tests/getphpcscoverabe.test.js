/* eslint-env jest */
const xml2js = require('xml2js')
const {getXmlReader, getPathReader, getDirectoryScanner} = require('../lib/index')

function mockReadFile (path, callback) {
  const mockData = `<?xml version="1.0"?><ruleset name="TestRules"><description>Test library.</description><rule ref="MyRuleset"/><file>src/foobar</file><file>src/baz/index-2.php</file></ruleset>`
  callback(null, mockData)
}

function mockReadPath (path, ignoreFiles) {
  const mockData = [
    'testdir/src/foobar/index-1.php',
    'testdir/src/foobar/index-2.php',
    'testdir/src/foobar/index-3.php',
    'testdir/src/baz/index-1.php',
    'testdir/src/baz/index-2.php',
    'testdir/phpcs.xml'
  ]
  if (!ignoreFiles.length) {
    return Promise.resolve(mockData)
  }
  const fileFilter = ignoreFiles[0]
  return Promise.resolve(mockData.filter(file => !fileFilter(file)))
}

test('finds matching files', () => {
  const parser = new xml2js.Parser()
  const getFilesFromXml = getXmlReader({readFile: mockReadFile, parseXmlString: parser.parseString})
  const getFilesFromPath = getPathReader({readFilesFromPath: mockReadPath})
  const scanDirectory = getDirectoryScanner({getFilesFromXml, getFilesFromPath})
  const targetDir = 'testdir'
  return scanDirectory(targetDir, {})
    .then(({found, notFound}) => {
      expect(found).toEqual([
        'testdir/src/foobar/index-1.php',
        'testdir/src/foobar/index-2.php',
        'testdir/src/foobar/index-3.php',
        'testdir/src/baz/index-2.php'
      ])
    })
})

test('finds all files in path', () => {
  const getFilesFromPath = getPathReader({readFilesFromPath: mockReadPath})
  return getFilesFromPath('testdir', {})
    .then((results) => {
      expect(results).toEqual([
        'testdir/src/foobar/index-1.php',
        'testdir/src/foobar/index-2.php',
        'testdir/src/foobar/index-3.php',
        'testdir/src/baz/index-1.php',
        'testdir/src/baz/index-2.php',
        'testdir/phpcs.xml'
      ])
    })
})

test('finds all paths in xml', () => {
  const parser = new xml2js.Parser()
  const getFilesFromXml = getXmlReader({readFile: mockReadFile, parseXmlString: parser.parseString})
  return getFilesFromXml('testdir/phpcs.xml')
    .then((results) => {
      expect(results).toEqual([
        'testdir/src/foobar',
        'testdir/src/baz/index-2.php'
      ])
    })
})

test('skips files matching ignore option', () => {
  const parser = new xml2js.Parser()
  const getFilesFromXml = getXmlReader({readFile: mockReadFile, parseXmlString: parser.parseString})
  const getFilesFromPath = getPathReader({readFilesFromPath: mockReadPath})
  const scanDirectory = getDirectoryScanner({getFilesFromXml, getFilesFromPath})
  const targetDir = 'testdir'
  return scanDirectory(targetDir, { ignore: '2' })
    .then(({found, notFound}) => {
      expect(found).toEqual([
        'testdir/src/foobar/index-1.php',
        'testdir/src/foobar/index-3.php'
      ])
    })
})

test('skips files matching multiple ignore options', () => {
  const parser = new xml2js.Parser()
  const getFilesFromXml = getXmlReader({readFile: mockReadFile, parseXmlString: parser.parseString})
  const getFilesFromPath = getPathReader({readFilesFromPath: mockReadPath})
  const scanDirectory = getDirectoryScanner({getFilesFromXml, getFilesFromPath})
  const targetDir = 'testdir'
  return scanDirectory(targetDir, { ignore: '2|3' })
    .then(({found, notFound}) => {
      expect(found).toEqual([
        'testdir/src/foobar/index-1.php'
      ])
    })
})

test('skips files not matching type option', () => {
  const parser = new xml2js.Parser()
  const getFilesFromXml = getXmlReader({readFile: mockReadFile, parseXmlString: parser.parseString})
  const getFilesFromPath = getPathReader({readFilesFromPath: mockReadPath})
  const scanDirectory = getDirectoryScanner({getFilesFromXml, getFilesFromPath})
  const targetDir = 'testdir'
  return scanDirectory(targetDir, { type: 'ha', ignore: '2' })
    .then(({found, notFound}) => {
      expect(found).toEqual([])
    })
})

test('includes files matching type option', () => {
  const parser = new xml2js.Parser()
  const getFilesFromXml = getXmlReader({readFile: mockReadFile, parseXmlString: parser.parseString})
  const getFilesFromPath = getPathReader({readFilesFromPath: mockReadPath})
  const scanDirectory = getDirectoryScanner({getFilesFromXml, getFilesFromPath})
  const targetDir = 'testdir'
  return scanDirectory(targetDir, { type: 'hp' })
    .then(({found, notFound}) => {
      expect(found).toEqual([
        'testdir/src/foobar/index-1.php',
        'testdir/src/foobar/index-2.php',
        'testdir/src/foobar/index-3.php',
        'testdir/src/baz/index-2.php'
      ])
    })
})

test('includes matching files if using patterns', () => {
  const patterns = [
    'testdir/src/foobar/.*\\.php$',
    'baz/index-2.*'
  ]
  const getFilesFromPath = getPathReader({readFilesFromPath: mockReadPath})
  const scanDirectory = getDirectoryScanner({patterns, getFilesFromPath})
  const targetDir = 'testdir'
  return scanDirectory(targetDir, {})
    .then(({found, notFound}) => {
      expect(found).toEqual([
        'testdir/src/foobar/index-1.php',
        'testdir/src/foobar/index-2.php',
        'testdir/src/foobar/index-3.php',
        'testdir/src/baz/index-2.php'
      ])
    })
})
