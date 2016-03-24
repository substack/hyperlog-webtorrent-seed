var webtorrent = require('webtorrent')
var level = require('level')
var swarmlog = require('swarmlog')
var fstore = require('fs-chunk-store')

var log = swarmlog({
  id: process.argv[2],
  db: level('/tmp/webtorrent-mirror.log'),
  sodium: require('chloride'),
  valueEncoding: 'json',
  hubs: [ 'https://signalhub.mafintosh.com' ]
})

var hseed = require('hyperlog-seed')
var seeder = hseed({
  db: level('/tmp/webtorrent-mirror.seed'),
  log: log,
  map: function (row) {
    if (row.link) return { type: 'put', link: row.link }
    if (row.unlink) return { type: 'del', link: row.unlink }
  }
})

var wseed = require('../')
wseed({
  db: level('/tmp/webtorrent-mirror.wseed'),
  store: function (n, opts) {
    return fstore(n, {
      path: '/tmp/webtorrent-mirror.store',
      length: opts.length
    })
  },
  seeder: seeder,
  client: webtorrent()
})
