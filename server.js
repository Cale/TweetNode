var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , Twit = require('twit')
  , io = require('socket.io').listen(server);
server.listen(4040);

// routing
// Tell node to load node-twitter-stream.html when the browser requests /
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/node-twitter-stream.html');
});

// Tell node to serve the CSS file when requested
app.get('/node-twitter-stream.css', function (req, res) {
  res.sendfile(__dirname + '/node-twitter-stream.css');
});

// When processeing the Twitter firehose, only show Tweets with this keyword
var watchList = ['nashville'];

var T = new Twit({
consumer_key:             'your key here'
  , consumer_secret:      'your secret here'
  , access_token:         'your token here'
  , access_token_secret:  'your token here'
});

io.sockets.on('connection', function (socket) {
  var stream = T.stream('statuses/filter', { track: watchList })
  //var stream = T.stream('statuses/sample') // Firehose (sampling of all Tweets)
  //var stream = T.stream('user') // Your user stream

  // When a Tweet is recieved:
  stream.on('tweet', function (tweet) {
    // Makes a link the Tweet clickable
    var turl = tweet.text.match( /(http|https|ftp):\/\/[^\s]*/i )
    if ( turl != null ) {
      turl = tweet.text.replace( turl[0], '<a href="'+turl[0]+'" target="new">'+turl[0]+'</a>' );
    } else {
      turl = tweet.text;
    }
    var mediaUrl;
    // Does the Tweet have an image attached?
    if ( tweet.entities['media'] ) {
      if ( tweet.entities['media'][0].type == "photo" ) {
        mediaUrl = tweet.entities['media'][0].media_url;
      } else {
        mediaUrl = null;
      }
    }
    // Send the Tweet to the browser
    io.sockets.emit('stream',turl, tweet.user.screen_name, tweet.user.profile_image_url, mediaUrl);
  });
});
