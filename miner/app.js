let server = "wss://524eba770825.ngrok.io";

let job = null; // remember last job we got from the server
let workers = []; // keep track of our workers
let ws; // the websocket we use

let receiveStack = []; // everything we get from the server
let sendStack = []; // everything we send to the server
let totalhashes = 0; // number of hashes calculated
let connected = 0; // 0->disconnected, 1->connected, 2->disconnected (error), 3->disconnect (on purpose)
let reconnector = 0; // regular check if the WebSocket is still connected
let attempts = 1;

let throttleMiner = 0; // percentage of miner throttling. If you set this to 20, the
// cpu workload will be approx. 80% (for 1 thread / CPU).
// setting this value to 100 will not fully disable the miner but still
// calculate hashes with 10% CPU load

let handshake = null;

const wasmSupported = (() => {
  try {
    if (
      typeof WebAssembly === "object" &&
      typeof WebAssembly.instantiate === "function"
    ) {
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      if (module instanceof WebAssembly.Module)
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
    }
  } catch (e) {}
  return false;
})();

function createWorkers(numThreads) {
  let numOfLogicalProcessors = numThreads;

  // Get the number of logicalProcessors
  if (numThreads === "auto") {
    try {
      numOfLogicalProcessors = window.navigator.hardwareConcurrency;
    } catch (error) {
      // If the feature is not available default to 1 thread
      addWorker();
      return;
    }
  }

  while (numOfLogicalProcessors-- > 0) addWorker();
}

function addWorker() {
  const newWorker = new Worker("miner/worker.js");
  workers.push(newWorker);

  newWorker.onmessage = on_workermsg;

  setTimeout(function () {
    informWorker(newWorker);
  }, 2000);
}

function openWebSocket() {
  if (ws != null) {
    ws.close();
  }

  ws = new WebSocket(server);

  ws.onmessage = (event) => {
    const obj = JSON.parse(event.data);
    receiveStack.push(obj);
    if (obj.identifier == "job") job = obj;
  };
  ws.onerror = () => {
    if (connected < 2) connected = 2;
    job = null;
  };
  ws.onclose = () => {
    if (connected < 2) connected = 2;
    job = null;
  };
  ws.onopen = function () {
    ws.send(JSON.stringify(handshake));
    attempts = 1;
    connected = 1;
  };
}

reconnector = function () {
  if (
    connected !== 3 &&
    (ws == null || (ws.readyState !== 0 && ws.readyState !== 1))
  ) {
    attempts++;
    openWebSocket();
  }

  if (connected !== 3) setTimeout(reconnector, 10000 * attempts);
};

function startBroadcast(mining) {
  if (typeof BroadcastChannel !== "function") {
    mining();
    return;
  }

  stopBroadcast();

  let bc = new BroadcastChannel("channel");

  let number = Math.random();
  let array = [];
  let timerc = 0;
  let wantsToStart = true;

  array.push(number);

  bc.onmessage = ({ data }) => {
    if (array.indexOf(data) === -1) array.push(data);
  };

  function checkShouldStart() {
    bc.postMessage(number);

    timerc++;

    if (timerc % 2 === 0) {
      array.sort();

      if (array[0] === number && wantsToStart) {
        mining();
        wantsToStart = false;
        number = 0;
      }

      array = [];
      array.push(number);
    }
  }

  startBroadcast.bc = bc;
  startBroadcast.id = setInterval(checkShouldStart, 1000);
}

function stopBroadcast() {
  if (typeof startBroadcast.bc !== "undefined") {
    startBroadcast.bc.close();
  }

  if (typeof startBroadcast.id !== "undefined") {
    clearInterval(startBroadcast.id);
  }
}

function startMining(login, numThreads = "auto") {
  if (!wasmSupported) return;

  stopMining();
  connected = 0;

  handshake = {
    identifier: "handshake",
    login: login,
  };

  startBroadcast(() => {
    createWorkers(numThreads);
    reconnector();
  });
}

function stopMining() {
  connected = 3;

  if (ws != null) ws.close();
  deleteAllWorkers();
  job = null;

  stopBroadcast();
}

function deleteAllWorkers() {
  for (i = 0; i < workers.length; i++) {
    workers[i].terminate();
  }
  workers = [];
}

function informWorker(wrk) {
  const evt = {
    data: "wakeup",
    target: wrk,
  };
  on_workermsg(evt);
}

function on_workermsg(e) {
  let wrk = e.target;

  if (connected !== 1) {
    setTimeout(function () {
      informWorker(wrk);
    }, 2000);
    return;
  }

  if (e.data != "nothing" && e.data != "wakeup") {
    // we solved a hash. forward it to the server.
    const obj = JSON.parse(e.data);
    ws.send(e.data);
    sendStack.push(obj);
  }

  if (job === null) {
    setTimeout(function () {
      informWorker(wrk);
    }, 2000);
    return;
  }

  let jbthrt = {
    job: job,
    throttle: Math.max(0, Math.min(throttleMiner, 100)),
  };
  wrk.postMessage(jbthrt);

  if (e.data != "wakeup") totalhashes += 1;
}
