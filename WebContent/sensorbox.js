//============================================================================================
// Start of standard Sensorbox Orbiter client code

function Sensorbox(roomprefix) {
    // name -> {listener: fn(name,value), room: room}
    this.sensors = {};
    this.connected = false;
    // specified room name
    this.roomprefix = roomprefix ? roomprefix : 'uk.ac.nottingham.module.g54ubi.cs.a32.';
    this.init();
    this.readyListener = null;
    this.closeListener = null;
    this.connected = false;
}

Sensorbox.prototype.setReadyListener = function(listener) {
    this.readyListener = listener;
    //log('readyListener = '+this.readyListener+' ('+listener+')');
};

Sensorbox.prototype.setCloseListener = function(listener) {
    this.closeListener = listener;
};

Sensorbox.prototype.watch = function(name, listener) {
    this.sensors[name] = {listener: listener};
    if (this.connected)
        this.addSensor(name, sensors[name]);
};

// initialise connection to union server
Sensorbox.prototype.init = function() {    
    // Create Orbiter object
    this.orbiter = new net.user1.orbiter.Orbiter();
    // then enable automatic reconnection (one attempt every 15 seconds)
    this.orbiter.getConnectionMonitor().setAutoReconnectFrequency(15000);
    this.orbiter.getLog().setLevel(net.user1.logger.Logger.DEBUG);

    // Register for connection events
    this.orbiter.addEventListener(net.user1.orbiter.OrbiterEvent.READY,
            function() { this.onReady(); }, this);
    this.orbiter.addEventListener(net.user1.orbiter.OrbiterEvent.CLOSE,
            function() { this.onClose(); }, this);

    console.log('connect...');
    // Connect to Union
    this.orbiter.connect("tryunion.com", 80);
};

// handle successful connection to Union server
Sensorbox.prototype.onReady = function(e) {
    log("Orbiter connected to Union!");
    if (this.readyListener) {
        try {
            //log('calling readyListener '+this.readyListener);
            this.readyListener();
        }
        catch (err) {
            log('readyListener error: '+err.message);
        }
    }
    //else
    //    log('no readyListener to call: '+this.readyListener);

    // initial sensors
    for (var sensorname in this.sensors) {
        var sensor = this.sensors[sensorname];
        this.addSensor(sensorname, sensor);
    }
    this.connected = true;
};

// add room/sensor
Sensorbox.prototype.addSensor = function(sensorname, sensor) {
    var roomname = this.roomprefix+sensorname;
    log('addSensor '+sensorname+' -> room '+roomname);
    // Create the room on the server
    sensor.room = this.orbiter.getRoomManager().createRoom(roomname);
    var self = this;
    sensor.room.addEventListener(net.user1.orbiter.AttributeEvent.UPDATE,
            function(e2) { self.updateRoomListener(e2, sensorname, sensor); });
    // Watch the room
    sensor.room.observe();
};

// handle error connecting to union server
Sensorbox.prototype.onClose = function(e) {
    log("Orbiter connection closed.");
    this.connected = false;
    if (this.closeListener) {
        try {
            this.closeListener();
        }
        catch (err) {
            log('closeListener error: '+err.message);
        }
    }
};

// observe room (RoomEvent)
Sensorbox.prototype.updateRoomListener = function(e, sensorname, sensor) {
    var attname = e.getChangedAttr().name;
    var value = e.getChangedAttr().value;
    log('update: '+sensorname+' '+attname+'='+value);
    if (attname=='value' && sensor.listener) {
        try {
            sensor.listener(sensorname, value);
        }
        catch (err) {
            log('listener '+sensorname+' error: '+err.message);
        }
    }
}; 

// End of standard Sensorbox Orbiter client code
//============================================================================================
// Code sample...
/*
//helper function to loader Orbiter.js
function addScriptFile(src, callback) {
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.onload = function() {
		callback();
	};
	script.src = src;
	window.document.body.appendChild(script);
}

ui.status.text('loading...');
addScriptFile("content/Orbiter.js", 
		function() {
	addScriptFile("content/sensorbox.js", 
			function() {
		ui.status.text('loaded orbiter and sensorbox');
		// only when orbiter is loaded can we start doing stuff...
		init();
	});
});

var sensorbox;

function readyListener() {
	ui.status.text('Connected');
}

function closeListener() {
	ui.status.text('Connection lost');
}

//initialise client... (can't do until scripts loaded)
function init() {    
	sensorbox = new Sensorbox();
	sensorbox.watch('device', onDevice);
	sensorbox.setReadyListener(readyListener);
	sensorbox.setCloseListener(closeListener);
}

//your callback function...
function onDevice(name, value) {
	// update the GUI for change of sensor 'name' to value (string) 
	ui.details.text('Sensor '+name+' = '+value+' at '+new Date());
}
*/