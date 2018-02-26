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

module.exports = {
  humanReport,
  jsonReport,
  getPercent
}
