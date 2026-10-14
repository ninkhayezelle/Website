const audio = document.querySelector("#audio");
const fileInput = document.querySelector("#audio-file");
const playButton = document.querySelector("#play-button");
const seek = document.querySelector("#seek");
const lyricsInput = document.querySelector("#lyrics-input");
const lyricsContainer = document.querySelector("#lyrics");
let lyrics = [
  "Your words go here",
  "Add lyrics below to follow along",
  "Then press play and sing ✨"
];

function timeLabel(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function renderLyrics() {
  lyricsContainer.replaceChildren();
  lyrics.forEach((line, index) => {
    const paragraph = document.createElement("p");
    paragraph.className = "lyric";
    paragraph.dataset.index = String(index);
    paragraph.textContent = line;
    lyricsContainer.append(paragraph);
  });
  updateLyrics();
}

function updateLyrics() {
  const lineElements = lyricsContainer.querySelectorAll(".lyric");
  const duration = audio.duration;
  const currentIndex = audio.currentTime > 0 && Number.isFinite(duration)
    ? Math.min(lineElements.length - 1, Math.floor(audio.currentTime / duration * lineElements.length))
    : -1;

  lineElements.forEach((line, index) => {
    line.classList.toggle("active", index === currentIndex);
    line.classList.toggle("past", currentIndex >= 0 && index < currentIndex);
  });

  if (currentIndex >= 0) {
    lineElements[currentIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function updateTimeline() {
  const duration = audio.duration || 0;
  document.querySelector("#current-time").textContent = timeLabel(audio.currentTime);
  document.querySelector("#duration").textContent = timeLabel(duration);
  seek.value = duration ? String(audio.currentTime / duration * 100) : "0";
  seek.style.setProperty("--progress", `${seek.value}%`);
  updateLyrics();
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  audio.pause();
  if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
  const objectUrl = URL.createObjectURL(file);
  audio.dataset.objectUrl = objectUrl;
  audio.src = objectUrl;
  document.querySelector("#song-title").textContent = file.name.replace(/\.[^.]+$/, "") || file.name;
  document.querySelector("#file-name").textContent = file.name;
  playButton.disabled = false;
  seek.disabled = false;
  playButton.textContent = "▶";
  playButton.setAttribute("aria-label", "Play");
  updateTimeline();
});

playButton.addEventListener("click", async () => {
  if (!audio.src) return;
  if (audio.paused) {
    try {
      await audio.play();
    } catch {
      document.querySelector("#file-name").textContent = "Could not play this file. Please choose another track.";
    }
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", () => {
  playButton.textContent = "Ⅱ";
  playButton.setAttribute("aria-label", "Pause");
});
audio.addEventListener("pause", () => {
  playButton.textContent = "▶";
  playButton.setAttribute("aria-label", "Play");
});
audio.addEventListener("loadedmetadata", updateTimeline);
audio.addEventListener("timeupdate", updateTimeline);
audio.addEventListener("ended", updateLyrics);

seek.addEventListener("input", () => {
  if (!Number.isFinite(audio.duration)) return;
  audio.currentTime = Number(seek.value) / 100 * audio.duration;
  updateTimeline();
});

document.querySelector("#save-lyrics").addEventListener("click", () => {
  const nextLyrics = lyricsInput.value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  lyrics = nextLyrics.length ? nextLyrics : ["Add your lyrics below to follow along"];
  renderLyrics();
});

window.addEventListener("beforeunload", () => {
  if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
});

renderLyrics();
