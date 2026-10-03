(function () {
  "use strict";

  var TARGET = 13;

  // --- Scores -----------------------------------------------------------
  function readScore(key) {
    var value = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(value) && value > 0 ? Math.min(value, TARGET) : 0;
  }

  var scores = { 1: readScore("score1"), 2: readScore("score2") };

  var scoreEls = { 1: document.getElementById("score-1"), 2: document.getElementById("score-2") };
  var countEls = { 1: document.getElementById("count-1"), 2: document.getElementById("count-2") };
  var fillEls = { 1: document.getElementById("progress-1"), 2: document.getElementById("progress-2") };
  var cardEls = {
    1: document.querySelector('.card[data-team="1"]'),
    2: document.querySelector('.card[data-team="2"]')
  };
  var plusBtnEls = {
    1: document.querySelector('.card[data-team="1"] .score-btn--plus'),
    2: document.querySelector('.card[data-team="2"] .score-btn--plus')
  };
  var minusBtnEls = {
    1: document.querySelector('.card[data-team="1"] .score-btn--minus'),
    2: document.querySelector('.card[data-team="2"] .score-btn--minus')
  };

  function renderTeam(team) {
    var score = scores[team];
    var won = score >= TARGET;

    scoreEls[team].textContent = score;
    countEls[team].textContent = won ? "Winner" : score + " / " + TARGET;
    fillEls[team].style.width = Math.min(score / TARGET, 1) * 100 + "%";
    plusBtnEls[team].disabled = won;
    minusBtnEls[team].disabled = score <= 0;
    cardEls[team].classList.toggle("is-winner", won);
  }

  function saveScores() {
    localStorage.setItem("score1", String(scores[1]));
    localStorage.setItem("score2", String(scores[2]));
  }

  function changeScore(team, delta) {
    scores[team] = Math.min(TARGET, Math.max(0, scores[team] + delta));
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
  // Elapsed time is derived from the wall clock, not counted ticks, so the
  // timer stays correct even while the tab is closed, suspended or throttled.
  var TIMER_KEY = "petanque.timer";
  var elapsed = 0; // accumulated seconds from paused run segments
  var startedAt = null; // Date.now() when running, null when paused
  var timerId = null;

  var timerEl = document.getElementById("timer");
  var toggleBtn = document.getElementById("timer-toggle");

  function readTimer() {
    try {
      var raw = localStorage.getItem(TIMER_KEY);
      if (!raw) {
        return;
      }
      var parsed = JSON.parse(raw);
      elapsed = Number.isFinite(parsed.elapsed) && parsed.elapsed > 0 ? parsed.elapsed : 0;
      startedAt = Number.isFinite(parsed.startedAt) ? parsed.startedAt : null;
    } catch (e) {
      elapsed = 0;
      startedAt = null;
    }
  }

  function saveTimer() {
    localStorage.setItem(TIMER_KEY, JSON.stringify({ elapsed: elapsed, startedAt: startedAt }));
  }

  function isRunning() {
    return startedAt !== null;
  }

  function currentSeconds() {
    var base = elapsed;
    if (startedAt !== null) {
      base += (Date.now() - startedAt) / 1000;
    }
    return Math.max(0, Math.floor(base));
  }

  function formatTime(total) {
    var minutes = Math.floor(total / 60);
    var secs = total % 60;
    return (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs;
  }

  function renderTimer() {
    timerEl.textContent = formatTime(currentSeconds());
  }

  function syncControls() {
    var running = isRunning();
    toggleBtn.classList.toggle("is-paused", !running);
    toggleBtn.setAttribute("aria-pressed", String(running));
    toggleBtn.setAttribute("aria-label", running ? "Pause timer" : "Start timer");
  }

  function stopTicking() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function ensureTicking() {
    if (timerId === null) {
      timerId = window.setInterval(renderTimer, 1000);
    }
  }

  function setRunning(next) {
    if (next === isRunning()) {
      return;
    }
    if (next) {
      startedAt = Date.now();
      ensureTicking();
    } else {
      elapsed += (Date.now() - startedAt) / 1000;
      startedAt = null;
      stopTicking();
    }
    saveTimer();
    syncControls();
    renderTimer();
  }

  toggleBtn.addEventListener("click", function () {
    setRunning(!isRunning());
  });

  document.getElementById("timer-reset").addEventListener("click", function () {
    setRunning(false);
    elapsed = 0;
    startedAt = null;
    saveTimer();
    syncControls();
    renderTimer();
  });

  // Background tabs throttle timers, so refresh from the clock on return.
  document.addEventListener("visibilitychange", renderTimer);
  window.addEventListener("pageshow", renderTimer);
  window.addEventListener("focus", renderTimer);

  // --- Init -------------------------------------------------------------
  renderTeam(1);
  renderTeam(2);
  readTimer();
  if (isRunning()) {
    ensureTicking();
  }
  syncControls();
  renderTimer();
})();
