(() => {
  if (window.__messengerVoiceBoosterLoaded) return;
  window.__messengerVoiceBoosterLoaded = true;

  let audioContext = null;
  let source = null;
  let gainNode = null;
  let compressor = null;
  let analyser = null;
  let enabled = true;
  let boostAmount = 2.5;

  async function initAudio() {
    if (audioContext) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      audioContext = new AudioContext();

      source = audioContext.createMediaStreamSource(stream);

      gainNode = audioContext.createGain();
      gainNode.gain.value = boostAmount;

      compressor = audioContext.createDynamicsCompressor();

      compressor.threshold.value = -42;
      compressor.knee.value = 24;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;

      source
        .connect(gainNode)
        .connect(compressor)
        .connect(analyser);

      await audioContext.resume();

      console.log("Messenger Voice Booster initialized.");
    } catch (err) {
      console.error("Voice Booster:", err);
    }
  }

  function updateGain() {
    if (!gainNode) return;

    gainNode.gain.setTargetAtTime(
      enabled ? boostAmount : 1,
      audioContext.currentTime,
      0.02
    );
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SET_ENABLED") {
      enabled = Boolean(message.value);
      updateGain();
      sendResponse({ ok: true });
    }

    if (message.type === "SET_BOOST") {
      boostAmount = Math.max(
        1,
        Math.min(Number(message.value) || 1, 8)
      );

      updateGain();
      sendResponse({
        ok: true,
        boost: boostAmount
      });
    }

    if (message.type === "START") {
      initAudio().then(() => {
        sendResponse({ ok: true });
      });

      return true;
    }
  });

  chrome.storage.local.get(
    ["enabled", "boost"],
    data => {
      enabled = data.enabled !== false;
      boostAmount = Number(data.boost) || 2.5;
    }
  );
})();
