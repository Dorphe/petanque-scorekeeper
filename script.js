(function () {
  "use strict";

  var TARGET = 13;

  // --- Scores -----------------------------------------------------------
  function readScore(key) {
    var value = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  var scores = { 1: readScore("score1"), 2: readScore("score2") };

  var scoreEls = { 1: document.getElementById("score-1"), 2: document.getElementById("score-2") };
  var fillEls = { 1: document.getElementById("progress-1"), 2: document.getElementById("progress-2") };
  var cardEls = {
    1: document.querySelector('.card[data-team="1"]'),
    2: document.querySelector('.card[data-team="2"]')
  };

  function renderTeam(team) {
    var score = scores[team];
    var won = score >= TARGET;

    scoreEls[team].textContent = score;
    fillEls[team].style.width = Math.min(score / TARGET, 1) * 100 + "%";
    cardEls[team].classList.toggle("is-winner", won);
  }

  function saveScores() {
    localStorage.setItem("score1", String(scores[1]));
    localStorage.setItem("score2", String(scores[2]));
  }

  function changeScore(team, delta) {
    scores[team] = Math.max(0, scores[team] + delta);
    saveScores();
    renderTeam(team);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".card"), function (card) {
    var team = card.getAttribute("data-team");
    Array.prototype.forEach.call(card.querySelectorAll(".score-btn"), function (btn) {
      btn.addEventListener("click", function () {
        changeScore(team, parseInt(btn.getAttribute("data-delta"), 10));
      });
    });
  });

  document.getElementById("reset-scores").addEventListener("click", function () {
    scores[1] = 0;
    scores[2] = 0;
    saveScores();
    renderTeam(1);
    renderTeam(2);
  });

  // --- Timer ------------------------------------------------------------
  var seconds = 0;
  var timerId = null;
  var running = false;

  var timerEl = document.getElementById("timer");
  var toggleBtn = document.getElementById("timer-toggle");

  function formatTime(total) {
    var minutes = Math.floor(total / 60);
    var secs = total % 60;
    return (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs;
  }

  function renderTimer() {
    timerEl.textContent = formatTime(seconds);
  }

  function setRunning(next) {
    running = next;
    if (running) {
      if (timerId === null) {
        timerId = window.setInterval(function () {
          seconds += 1;
          renderTimer();
        }, 1000);
      }
    } else if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    toggleBtn.classList.toggle("is-paused", !running);
    toggleBtn.setAttribute("aria-pressed", String(running));
    toggleBtn.setAttribute("aria-label", running ? "Pause timer" : "Start timer");
  }

  toggleBtn.addEventListener("click", function () {
    setRunning(!running);
  });

  document.getElementById("timer-reset").addEventListener("click", function () {
    setRunning(false);
    seconds = 0;
    renderTimer();
  });

  // --- Score pip glow shader -------------------------------------------
  // Values mirrored from the SCORE PIP component in the design file.
  var SHADER_OPTIONS = {
    lightAngle: 75.6,
    scatter: 0.3164,
    density: 8.575,
    ambient: 0.14,
    softness: 23.4,
    noise: 0.35,
    noiseScale: 1.136,
    radius: 24,
    quality: 0.5,
    maxWidth: 260
  };

  if (typeof window.initSoftShape === "function") {
    Array.prototype.forEach.call(document.querySelectorAll(".card"), function (card) {
      var canvas = card.querySelector(".card__glow");
      if (!canvas) {
        return;
      }
      var color = window.getComputedStyle(card).getPropertyValue("--glow-color").trim();
      window.initSoftShape(canvas, Object.assign({ color: color || "#c71e4e" }, SHADER_OPTIONS));
    });
  }

  // --- Init -------------------------------------------------------------
  renderTeam(1);
  renderTeam(2);
  renderTimer();
  setRunning(false);
})();
