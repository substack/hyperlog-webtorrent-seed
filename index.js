var parseTorrent = require('parse-torrent')
var mkdirp = require('mkdirp')
var fs = require('fs')
var path = require('path')

module.exports = function (opts) {
  var client = opts.client
  var seeder = opts.seeder
  var dir = opts.dir

  seeder.on('seed', function (link) {
    var t = parseTorrent(link)
    for (var i = 0; i < client.torrents.length; i++) {
      if (client[i].infoHash === t.infoHash) return
    }
    var tdir = path.join(dir, t.infoHash)
    fs.readdir(tdir, function (err, files) {
      if (!files) client.add(link, onadd)
      else {
        var tfiles = files.map(function (f) { return path.join(tdir, f) })
        client.seed(tfiles, onseed)
      }
    })
    function onadd (s) {
      var tdir = path.join(dir, t.infoHash)
      mkdirp(tdir, function () {
        t.files.forEach(function (file) {
          file.createReadStream()
            .pipe(fs.createWriteStream(path.join(tdir, t.infoHash)))
        })
      })
    }
    function onseed (s) {
      if (s.infoHash !== t.infoHash) {
        client.remove(s)
        client.add(link, onadd)
      }
    }
  })
  seeder.on('unseed', function (link) {
    var t = parseTorrent(link)
    for (var i = 0; i < client.torrents.length; i++) {
      if (client[i].infoHash === t.infoHash) client[i].destroy()
    }
  })
}
