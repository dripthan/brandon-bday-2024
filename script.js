
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
// https://blog.logrocket.com/audio-visualizer-from-scratch-javascript/#web-audio-api-overview
// https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
// https://stackoverflow.com/questions/24083349/understanding-getbytetimedomaindata-and-getbytefrequencydata-in-web-audio
// https://github.com/dripthan/RDawgGraduation

class NathanVusAudioVisualizer {
  // Access audio using the audio variable in this class for audio attributes (play, paused, currentTime, etc.)
  constructor(audioPath) {
    // Create an audio object
    this.audio = new Audio(audioPath);
    this.context = null;
  }
  init() {
    // Create an audio context object (needed for the rest of this shit)
    this.context = new AudioContext();
    // Create the analyzer object (this object generates waveform data in both time and freq domain)
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 4096;
    // Create the source object for the analyzer
    this.source = this.context.createMediaElementSource(this.audio);
    // Connections must be chained in this manner to operate: SOURCE --> ANALYZER --> DESTINATION (Speakers)
    // Chain the source to the analyzer
    this.source.connect(this.analyzer);
    // Chain the analyzer to the destination (users speakers)
    this.analyzer.connect(this.context.destination);
    // Define a data buffer to store wave data
    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }
  getData() {
    if (this.audio.paused) return null;
    if (this.context == null) this.init();
    // Puts data into previously defined data buffer and returns
    this.analyzer.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}

(async () => {

  const loadImage = path => new Promise(resolve => {
    const image = new Image(0);
    image.onload = () => resolve(image);
    image.src = path;
  });

  const canvas = document.querySelector('canvas');
  const c = canvas.getContext('2d', { willReadFrequently: true });
  const mouse = { down: false };

  // images
  const brandoff = await loadImage('./brandoff.jpg');
  const brandon = await loadImage('./brandon.png');
  const brandWidth = brandoff.naturalWidth;
  const brandHeight = brandoff.naturalHeight;
  const brandScale = 0.4;
  const bill = await loadImage('./Usdollar100front.jpg');
  const billScale = 0.02;

  // audios
  const nvav = new NathanVusAudioVisualizer('./Gunna - Dollaz On My Head ft. (Young Thug) [Bass Boosted].mp3');

  const mainMenuScene = () => {
    c.fillStyle = 'white';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.font = '32px monospace';
    c.textBaseline = 'middle';
    c.textAlign = 'center';
    c.fillStyle = 'black';
    c.fillText('Turn volume up and click anywhere...', canvas.width / 2, canvas.height / 2);
    if (mouse.down) sceneIndex++;
    requestAnimationFrame(scenes[sceneIndex]);
  };

  let fadeToBlackAlpha = 0;
  const fadeToBlackScene = () => {
    c.fillStyle = `rgba(0,0,0,${fadeToBlackAlpha})`;
    c.fillRect(0, 0, canvas.width, canvas.height);
    fadeToBlackAlpha += 0.001;
    const canvasRGB = c.getImageData(0, 0, 1, 1).data;
    if (canvasRGB[0] < 5) {
      sceneIndex++;
      // nvav.audio.currentTime = 10;
      nvav.audio.play();
      // call this function once to avoid lagging when the beat drops lmao
      const frequencyData = nvav.getData();
    }
    requestAnimationFrame(scenes[sceneIndex]);
  };

  let brandonAlpha = 0;
  const pictureFadesInScene = () => {
    c.globalAlpha = brandonAlpha;
    c.drawImage(brandoff, (canvas.width - brandWidth * brandScale) / 2, (canvas.height - brandHeight  * brandScale) / 2, brandWidth  * brandScale, brandHeight  * brandScale);
    if (brandonAlpha < 1) brandonAlpha += 0.001;
    if (nvav.audio.currentTime > 13.57) sceneIndex++;
    requestAnimationFrame(scenes[sceneIndex]);
  };

  const parts = [];
  const brandonScene = () => {
    c.globalAlpha = 1;
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    const frequencyData = nvav.getData();
    const shakeConstant = frequencyData[7] == 255 ? 25 : 1;
    c.drawImage(
      brandon,
      (canvas.width - brandWidth * brandScale) / 2 + (Math.random() - 0.5) * shakeConstant,
      (canvas.height - brandHeight  * brandScale) / 2 + (Math.random() - 0.5) * shakeConstant,
      brandWidth  * brandScale,
      brandHeight  * brandScale);

    parts.push({
      x: Math.random() < 0.5 ? Math.random() * canvas.width / 4 : canvas.width * 3 / 4 + Math.random() * canvas.width / 4,
      y: -100,
      r: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 10 + 5,
      vr: (Math.random() - 0.5) * 0.05
    });
    for (let i = parts.length - 1; i >= 0; --i) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.drawImage(
        bill,
        -bill.naturalWidth * billScale / 2,
        -bill.naturalHeight * billScale / 2,
        bill.naturalWidth * billScale,
        bill.naturalHeight * billScale);
      c.restore();
      if (p.y > canvas.height + 100) parts.splice(i, 1);
    }

    requestAnimationFrame(scenes[sceneIndex]);
  };

  const scenes = [mainMenuScene, fadeToBlackScene, pictureFadesInScene, brandonScene];
  let sceneIndex = 0;

  addEventListener('load', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    requestAnimationFrame(scenes[sceneIndex]);
  });

  addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  });

  addEventListener('mousedown', () => mouse.down = true);
  addEventListener('mouseup', () => mouse.down = false);

})();