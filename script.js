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
  var nameEls = {
    1: document.querySelector('.card[data-team="1"] .card__name'),
    2: document.querySelector('.card[data-team="2"] .card__name')
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
    if (scores[team] >= TARGET) {
      setRunning(false);
    }
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
    resetTimer();
  });

  // --- Team names -------------------------------------------------------
  var NAMES_KEY = "petanque.names";
  var DEFAULT_NAMES = { 1: "Team 1", 2: "Team 2" };
  var teamNames = readNames();

  function sanitizeName(value, fallback) {
    var name = typeof value === "string" ? value.trim() : "";
    return name || fallback;
  }

  function readNames() {
    try {
      var raw = localStorage.getItem(NAMES_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          1: sanitizeName(parsed[1], DEFAULT_NAMES[1]),
          2: sanitizeName(parsed[2], DEFAULT_NAMES[2])
        };
      }
    } catch (e) {
      // fall through to defaults
    }
    return { 1: DEFAULT_NAMES[1], 2: DEFAULT_NAMES[2] };
  }

  function saveNames() {
    localStorage.setItem(NAMES_KEY, JSON.stringify(teamNames));
  }

  function renderName(team) {
    nameEls[team].textContent = teamNames[team];
    nameEls[team].setAttribute("aria-label", "Rename " + teamNames[team]);
  }

  function startRename(team) {
    var el = nameEls[team];
    if (el.dataset.editing === "true") {
      return;
    }

    var input = document.createElement("input");
    input.type = "text";
    input.className = "card__name-input";
    input.value = teamNames[team];
    input.maxLength = 24;
    input.setAttribute("aria-label", "Team name");

    el.dataset.editing = "true";
    el.hidden = true;
    el.parentNode.insertBefore(input, el.nextSibling);
    input.focus();
    input.select();

    function finish(commit) {
      if (el.dataset.editing !== "true") {
        return;
      }
      el.dataset.editing = "";
      if (commit) {
        teamNames[team] = sanitizeName(input.value, DEFAULT_NAMES[team]);
        saveNames();
      }
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
      el.hidden = false;
      renderName(team);
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", function () {
      finish(true);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".card"), function (card) {
    var team = card.getAttribute("data-team");
    var nameEl = card.querySelector(".card__name");
    if (nameEl) {
      nameEl.addEventListener("click", function () {
        startRename(team);
      });
    }
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

  function resetTimer() {
    setRunning(false);
    elapsed = 0;
    startedAt = null;
    saveTimer();
    syncControls();
    renderTimer();
  }

  document.getElementById("timer-reset").addEventListener("click", resetTimer);

  // Background tabs throttle timers, so refresh from the clock on return.
  document.addEventListener("visibilitychange", renderTimer);
  window.addEventListener("pageshow", renderTimer);
  window.addEventListener("focus", renderTimer);

  // --- Init -------------------------------------------------------------
  renderTeam(1);
  renderTeam(2);
  renderName(1);
  renderName(2);
  readTimer();
  if (isRunning()) {
    ensureTicking();
  }
  syncControls();
  renderTimer();
})();
