# hyperlog-webtorrent-seed

seed webtorrent magnet links from a hyperlog

# example

Mirror content from a swarmlog:

``` js
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

var wseed = require('hyperlog-webtorrent-seed')
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
```

Seed content from stdin and publish the magnet links to a swarmlog:

``` js
var webtorrent = require('webtorrent')
var parseTorrent = require('parse-torrent')
var level = require('level')
var swarmlog = require('swarmlog')

var log = swarmlog({
  keys: require('./keys.json'),
  db: level('/tmp/webtorrent-publish.db'),
  sodium: require('chloride'),
  valueEncoding: 'json',
  hubs: [ 'https://signalhub.mafintosh.com' ]
})

var client = webtorrent()
client.seed([process.stdin], { name: 'test.txt' }, function (torrent) {
  log.append({ link: torrent.magnetURI })
  console.log(torrent.magnetURI)
})
```

---

Generate a keypair for the swarmlog and set up a mirror to follow the public
key:

```
$ node -pe "JSON.stringify(require('ssb-keys').generate())" > keys.json
$ json public < keys.json
T+EccaMYIIsfqNu0Mz549yNhmRC3HCrWr8oghnWHoRw=.ed25519
$ electron-spawn mirror.js T+EccaMYIIsfqNu0Mz549yNhmRC3HCrWr8oghnWHoRw=.ed25519
```

Publish content and download the content from the mirror with webtorrent:

```
$ echo WOW | electron-spawn publish.js
magnet:?xt=urn:btih:8409223bb06b008d0ef7efe7edd28b2f47a0a9db&dn=test.txt&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.webtorrent.io
^C
$ electron-spawn `which webtorrent` 'magnet:?xt=urn:btih:8409223bb06b008d0ef7efe7edd28b2f47a0a9db&dn=test.txt&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.webtorrent.io'
```

# api

``` js
var wseed = require('hyperlog-webtorrent-seed')
```

## wseed(opts)

Seed to webtorrent given:

* `opts.client` - a [webtorrent][1] instance
* `opts.seeder` - a [hyperlog-seed][2] instance
* `opts.db` - a [levelup][3] instance
* `opts.store(chunkLength, opts)` - function that returns an
[abstract-chunk-store][4] instance given a `chunkLength` and an `opts.length` of
the entire file

[1]: https://npmjs.com/package/webtorrent
[2]: https://npmjs.com/package/hyperlog-seed
[3]: https://npmjs.com/package/level
[3]: https://npmjs.com/package/abstract-chunk-store

# license

BSD
