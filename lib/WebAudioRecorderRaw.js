importScripts("WavAudioEncoder.min.js");

var sampleRate = 44100,
    numChannels = 2,
    options = undefined,
    maxBuffers = undefined,
    recBuffers = undefined,
    bufferCount = 0;

function error(message) {
  self.postMessage({ command: "error", message: "raw: " + message });
}

function init(data) {
  sampleRate = data.config.sampleRate;
  numChannels = data.config.numChannels;
  options = data.options;
};

function setOptions(opt) {
  if (recBuffers)
    error("cannot set options during recording");
  else
    options = opt;
}

function start(bufferSize) {
  maxBuffers = Math.ceil(options.timeLimit * sampleRate / bufferSize);
  recBuffers = [];
}

function record(buffer) {
  if (bufferCount++ < maxBuffers) {
    if (recBuffers) {
      recBuffers.push(buffer);
    }
  } else {
    self.postMessage({ command: "timeout" });
  }
};

function finish() {
  self.postMessage({
    command: "complete",
    blob: recBuffers,
    metadata: {
      sampleRate,
      numChannels,
      options
    }
  })
  cleanup();
};

function cleanup() {
  recBuffers = undefined;
  bufferCount = 0;
}

self.onmessage = function(event) {
  var data = event.data;
  switch (data.command) {
    case "init":    init(data);                 break;
    case "options": setOptions(data.options);   break;
    case "start":   start(data.bufferSize);     break;
    case "record":  record(data.buffer);        break;
    case "finish":  finish();                   break;
    case "cancel":  cleanup();
  }
};

self.postMessage({ command: "loaded" });
