// Songs list — starts empty, filled in when the user loads files

let songs = [];


// Get Elements

let audio = document.getElementById("audio");
let playBtn = document.getElementById("play");
let prevBtn = document.getElementById("prev");
let nextBtn = document.getElementById("next");

let title = document.getElementById("title");
let artist = document.getElementById("artist");
let cover = document.getElementById("cover");

let progress = document.getElementById("progress");
let volume = document.getElementById("volume");

let currentTime = document.getElementById("currentTime");
let duration = document.getElementById("duration");

let playlist = document.getElementById("playlist");
let fileInput = document.getElementById("fileInput");
let visualizerCanvas = document.getElementById("visualizer");
let vCtx = visualizerCanvas.getContext("2d");

let currentSong = 0;
let isPlaying = false;


// ---------- Background beat visualizer ----------
// Uses the Web Audio API to analyze whatever is playing in <audio id="audio">
// and draws bars in the background canvas that react to the music in real time.

let audioCtx = null;
let analyser = null;
let dataArray = null;

function resizeVisualizer() {
    visualizerCanvas.width = window.innerWidth;
    visualizerCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeVisualizer);
resizeVisualizer();

// The audio graph can only be connected once per <audio> element, so this
// is set up lazily the first time the user hits play — and only ever runs once.
function setupAudioContext() {

    if (audioCtx) {
        return;
    }

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Route the <audio> element's output through the analyser, then on to
    // the speakers — skipping the "connect to destination" step would mean
    // you could see the visualizer but never actually hear the song.
    let sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    drawVisualizer();

}

function drawVisualizer() {

    requestAnimationFrame(drawVisualizer);

    analyser.getByteFrequencyData(dataArray);

    vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    let barCount = dataArray.length;
    let barWidth = visualizerCanvas.width / barCount;
    let centerY = visualizerCanvas.height / 2;

    for (let i = 0; i < barCount; i++) {

        let value = dataArray[i]; // 0–255, higher = louder at that frequency
        let barHeight = (value / 255) * (visualizerCanvas.height / 2.4);

        let gradient = vCtx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        gradient.addColorStop(0, "rgba(139,58,62,0.55)");   // matte maroon, matches the sliders
        gradient.addColorStop(1, "rgba(31,42,68,0.15)");    // fades into the page background color

        vCtx.fillStyle = gradient;

        // mirrored bars, above and below the vertical center — a classic equalizer look
        vCtx.fillRect(i * barWidth, centerY - barHeight, barWidth - 2, barHeight);
        vCtx.fillRect(i * barWidth, centerY, barWidth - 2, barHeight);

    }

    // subtle pulse on the cover art, driven by the bass frequencies (first few bins)
    let bassSum = dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3];
    let bassAverage = bassSum / 4;
    let pulseScale = 1 + (bassAverage / 255) * 0.06;
    cover.style.transform = "scale(" + pulseScale.toFixed(3) + ")";

}


// ---------- Loading songs from the user's computer ----------

fileInput.addEventListener("change", function (event) {

    let files = Array.from(event.target.files);

    if (files.length === 0) {
        return;
    }

    // read every file's ID3 tags (title, artist, embedded cover art)
    // in parallel, then build the playlist once they've all resolved
    let readPromises = files.map(readSongFile);

    Promise.all(readPromises).then(function (newSongs) {

        songs = songs.concat(newSongs);

        currentSong = songs.length - newSongs.length; // jump to first newly-added song

        loadSong(currentSong);

    });

});


// Read one audio file's tags, falling back to the filename if a tag is missing

function readSongFile(file) {

    return new Promise(function (resolve) {

        let objectUrl = URL.createObjectURL(file);
        let fallbackName = file.name.replace(/\.[^/.]+$/, ""); // strip extension

        // jsmediatags needs to be loaded (via the CDN script tag in index.html)
        if (typeof jsmediatags === "undefined") {
            resolve({
                name: fallbackName,
                artist: "Unknown Artist",
                file: objectUrl,
                cover: null
            });
            return;
        }

        jsmediatags.read(file, {

            onSuccess: function (tag) {

                let tags = tag.tags || {};
                let coverUrl = pictureToUrl(tags.picture);

                resolve({
                    name: tags.title || fallbackName,
                    artist: tags.artist || "Unknown Artist",
                    file: objectUrl,
                    cover: coverUrl
                });

            },

            onError: function () {

                // no readable tags — just use the filename
                resolve({
                    name: fallbackName,
                    artist: "Unknown Artist",
                    file: objectUrl,
                    cover: null
                });

            }

        });

    });

}


// Convert an embedded ID3 picture tag into a usable image URL

function pictureToUrl(picture) {

    if (!picture || !picture.data) {
        return null;
    }

    let byteArray = new Uint8Array(picture.data);
    let blob = new Blob([byteArray], { type: picture.format });

    return URL.createObjectURL(blob);

}


// Load Song

function loadSong(index) {

    if (songs.length === 0) {
        return;
    }

    let song = songs[index];

    audio.src = song.file;
    title.innerHTML = song.name;
    artist.innerHTML = song.artist;

    if (song.cover) {
        cover.src = song.cover;
    } else {
        cover.src = ""; // falls back to the placeholder icon set in CSS
    }

    // reset display until the new file's metadata is ready
    progress.value = 0;
    currentTime.innerHTML = "0:00";
    duration.innerHTML = "0:00";

    showPlaylist();

}


// Play Song

function playSong() {

    if (songs.length === 0) {
        return;
    }

    // the audio graph must be created (and resumed) from a user gesture —
    // clicking play satisfies that browser requirement
    setupAudioContext();

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    let playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.catch(function (error) {
            console.log("Playback was blocked or the file could not be found:", error);
        });
    }

    isPlaying = true;

    playBtn.innerHTML =
    '<i class="fa-solid fa-pause"></i>';

}


// Pause Song

function pauseSong() {

    audio.pause();

    isPlaying = false;

    playBtn.innerHTML =
    '<i class="fa-solid fa-play"></i>';

}


// Play / Pause Button

playBtn.addEventListener("click", function () {

    if (isPlaying) {
        pauseSong();
    }
    else {
        playSong();
    }

});


// Next Song

nextBtn.addEventListener("click", function () {

    if (songs.length === 0) {
        return;
    }

    currentSong++;

    if (currentSong >= songs.length) {
        currentSong = 0;
    }

    loadSong(currentSong);
    playSong();

});


// Previous Song

prevBtn.addEventListener("click", function () {

    if (songs.length === 0) {
        return;
    }

    currentSong--;

    if (currentSong < 0) {
        currentSong = songs.length - 1;
    }

    loadSong(currentSong);
    playSong();

});


// Show duration as soon as the file's metadata is available

audio.addEventListener("loadedmetadata", function () {

    duration.innerHTML = formatTime(audio.duration);

});


// Progress Bar

audio.addEventListener("timeupdate", function () {

    if (audio.duration) {

        let value = (audio.currentTime / audio.duration) * 100;

        progress.value = value;

        currentTime.innerHTML = formatTime(audio.currentTime);

        duration.innerHTML = formatTime(audio.duration);

    }

});


// Change Progress

progress.addEventListener("input", function () {

    if (audio.duration) {

        audio.currentTime =
        (progress.value / 100) * audio.duration;

    }

});


// Volume

volume.addEventListener("input", function () {

    audio.volume = volume.value / 100;

});


// Playlist

function showPlaylist() {

    playlist.innerHTML = "";

    if (songs.length === 0) {

        let empty = document.createElement("li");
        empty.className = "empty-state";
        empty.innerHTML = 'No songs yet — click "Load Songs" above';
        playlist.appendChild(empty);
        return;

    }

    for (let i = 0; i < songs.length; i++) {

        let li = document.createElement("li");

        li.innerHTML = songs[i].name + " - " + songs[i].artist;

        if (i == currentSong) {
            li.classList.add("active-song");
        }

        li.onclick = function () {

            currentSong = i;

            loadSong(currentSong);

            playSong();

        };

        playlist.appendChild(li);

    }

}


// Time Format

function formatTime(time) {

    if (isNaN(time)) {
        return "0:00";
    }

    let minutes = Math.floor(time / 60);

    let seconds = Math.floor(time % 60);

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return minutes + ":" + seconds;

}


// Auto Play Next Song

audio.addEventListener("ended", function () {

    if (songs.length === 0) {
        return;
    }

    currentSong++;

    if (currentSong >= songs.length) {
        currentSong = 0;
    }

    loadSong(currentSong);

    playSong();

});


// Keyboard Support

document.addEventListener("keydown", function (event) {

    if (event.code == "Space") {

        event.preventDefault();

        if (isPlaying) {
            pauseSong();
        }
        else {
            playSong();
        }

    }

    if (event.key == "ArrowRight") {
        nextBtn.click();
    }

    if (event.key == "ArrowLeft") {
        prevBtn.click();
    }

});
