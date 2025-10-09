const video = document.getElementById('video');

// Load all required models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models')
])
  .then(startVideo)
  .catch(err => console.error('Failed to load models:', err));

// Start video stream
async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    });
    video.srcObject = stream;
  } catch (err) {
    console.error('Webcam access denied:', err);
  }
}

// Detection options
const detectionOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.5
});

// Handle video play event
video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  video.parentElement.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const ctx = canvas.getContext('2d');
  let isProcessing = false;

  // Use requestAnimationFrame for better performance
  async function detectFaces() {
    if (isProcessing) return;

    isProcessing = true;

    try {
      const detections = await faceapi
        .detectAllFaces(video, detectionOptions)
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    } catch (err) {
      console.error('Detection error:', err);
    }

    isProcessing = false;
  }

  // Run detection at ~10 FPS for optimal performance
  setInterval(detectFaces, 100);
});