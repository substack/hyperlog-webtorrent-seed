var parseTorrent = require('parse-torrent')
var mkdirp = require('mkdirp')
var defaults = require('levelup-defaults')
var EventEmitter = require('events').EventEmitter

module.exports = function (opts) {
  var client = opts.client
  var seeder = opts.seeder
  var db = defaults(opts.db, { valueEncoding: 'binary' })
  var store = opts.store
  var self = new EventEmitter

  seeder.on('seed', function (link) {
    var t = parseTorrent(link)
    for (var i = 0; i < client.torrents.length; i++) {
      var c = client.torrents[i]
      if (c && c.infoHash === t.infoHash) return
    }
    db.get(t.infoHash, function (err, torrentFile) {
      if (notFound(err)) {
        client.add(link, { store: store }, onadd)
      } else if (err) {
        self.emit('error', err)
      } else {
        client.add(torrentFile, { store: store }, function (torrent) {})
      }
    })
    function onadd (torrent) {
      db.put(t.infoHash, torrent.torrentFile, function (err) {
        if (err) self.emit('error', err)
      })
    }
  })
  seeder.on('unseed', function (link) {
    var t = parseTorrent(link)
    for (var i = 0; i < client.torrents.length; i++) {
      if (client[i] && client[i].infoHash === t.infoHash) client[i].destroy()
    }
  })
  return self
}

function notFound (err) {
  return err && (/^notfound/i.test(err.message) || err.notFound)
}
