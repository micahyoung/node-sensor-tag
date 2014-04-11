var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    SensorTag = require('sensortag'),
    RSVP = require('rsvp');

var tag = new Tag();
server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
  setInterval(function() {
    tag.getHumidity().then(function(temperature, humidity){
      socket.emit('temperature', temperature);
    });
  }, 1000);
});

function Tag() {
  var self = this;
  var P = RSVP.Promise;

  initialize();

  return {
    getHumidity: getHumidity
  };

  function initialize() {
    if(!self.initPromise) {
      self.initPromise = new P(function(resolve, reject) {
        SensorTag.discover(function(sensorTag) {
          console.log("discovered");
          sensorTag.connect(function() {
            console.log("connected");
            sensorTag.discoverServicesAndCharacteristics(function() {
              console.log("services discovered");
              sensorTag.enableHumidity(function() {
                console.log("humidity enabled");
                resolve(sensorTag);
              });
            });
          });
        }, 'bc6a29aece18');
      });
    }

    return self.initPromise;
  }

  function getHumidity() {
    return self.initPromise.then(function(sensorTag) {
      return new P(function(resolve, reject) {
        sensorTag.readHumidity(function(temperature, humidity) {
          resolve(temperature, humidity);
        });
      });
    }).catch(function(reason) {
      throw reason;
    });
  }
}
