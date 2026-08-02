import "./Home.scss";

import { useEffect, useState, useRef } from "react";

import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";
import Result from "../../components/Result/Result";
import { db } from "../../firebase-config";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";

// Helper function to handle mic threshold & enforce 75 max cap

const Home = () => {
  const volumeLockedRef = useRef(false);
  const minThresholdRef = useRef(5);
  const maxThresholdRef = useRef(85);
  const [volume, setVolume] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [customVolume, setCustomVolume] = useState(0);
  const [mode, setMode] = useState("manual");
  const [showResult, setShowResult] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const processMicVolume = (rawVolume, minThreshold = 5, maxThreshold = 85) => {
    if (rawVolume <= minThreshold) {
      return 0;
    }

    const scaled =
      ((rawVolume - minThreshold) / (100 - minThreshold)) * maxThreshold;

    return Math.min(maxThreshold, Math.round(scaled));
  };

  // Ref to hold current customVolume inside requestAnimationFrame loop
  const customVolumeRef = useRef(0);
  customVolumeRef.current = customVolume;

  // Ref to lock result screen so volume decay doesn't close it automatically
  const showResultRef = useRef(false);

  const stopMic = async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        await audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  };

  const startMic = async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      source.connect(analyser);

      analyserRef.current = analyser;
      dataArrayRef.current = new Float32Array(analyser.fftSize);

      updateVolume();
    } catch (err) {
      console.error(err);
    }
  };

  const updateVolume = () => {
    if (volumeLockedRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return;

    analyser.getFloatTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }

    const rms = Math.sqrt(sum / dataArray.length);
    const rawVolume = Math.min(100, Math.round(rms * 350));
    const micVolume = processMicVolume(
      rawVolume,
      minThresholdRef.current,
      maxThresholdRef.current,
    );

    if (customVolumeRef.current > 0) {
      const custom = Math.min(100, customVolumeRef.current);

      setVolume(custom);

      // Don't allow the mic to overwrite the custom value
      if (custom >= 100) {
        return;
      }
    } else {
      setVolume((prev) => {
        if (micVolume === 0) return 0;

        let smoothed = Math.round(prev * 0.8 + micVolume * 0.2);

        if (smoothed <= 2) smoothed = 0;

        return smoothed;
      });
    }

    animationRef.current = requestAnimationFrame(updateVolume);
  };

  // 1. Single consolidated Firestore listener & Decay handler
  useEffect(() => {
    let decayTimeout = null;
    const docRef = doc(db, "dulcoflex-excitometer", "excitometer");

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        const isMicEnabled = data.micEnabled ?? false;
        const currentCustomVol = data.customVolume ?? 0;
        const currentMode = data.mode ?? "manual";

        setMicEnabled(isMicEnabled);
        setCustomVolume(currentCustomVol);
        setMode(currentMode);
        const min = data.minThreshold ?? 5;
        const max = data.maxThreshold ?? 85;

        minThresholdRef.current = min;
        maxThresholdRef.current = max;

        if (!isMicEnabled) {
          setVolume(currentCustomVol);
        }

        // Handle decay if customVolume > 0
        if (currentCustomVol > 0) {
          if (decayTimeout) clearTimeout(decayTimeout);

          decayTimeout = setTimeout(async () => {
            try {
              if (!showResultRef.current && currentCustomVol < 100) {
                setCustomVolume(0);
                setVolume(0);
                await updateDoc(docRef, { customVolume: 0 });
              }
            } catch (error) {
              console.error(
                "Failed to reset customVolume in Firestore:",
                error,
              );
            }
          }, 500);
        }
      }
    });

    return () => {
      unsubscribe();
      if (decayTimeout) clearTimeout(decayTimeout);
    };
  }, []);

  // 2. Trigger Result screen when volume reaches 100%
  useEffect(() => {
    if (volume >= 100 && !showResult) {
      volumeLockedRef.current = true;
      setVolume(100);

      showResultRef.current = true;

      stopMic().then(() => {
        setTimeout(() => {
          setShowResult(true);
        }, 1000);
      });
    }
  }, [volume, showResult]);

  // 3. Manage mic lifecycle based on micEnabled & showResult
  useEffect(() => {
    let mounted = true;

    const restartMic = async () => {
      await stopMic();
      if (mounted && micEnabled && !showResult) {
        await startMic();
      }
    };

    restartMic();

    return () => {
      mounted = false;
      stopMic();
    };
  }, [micEnabled, showResult]);

  useEffect(() => {
    const docRef = doc(db, "dulcoflex-excitometer", "excitometer");

    const handleKeyDown = async (e) => {
      const key = e.key;

      // Only allow number keys 0-9
      if (!/^[0-9]$/.test(key)) return;

      // 1 -> 10, 2 -> 20, ..., 9 -> 90, 0 -> 100
      const value = key === "0" ? 100 : Number(key) * 10;

      try {
        await updateDoc(docRef, {
          customVolume: value,
        });
      } catch (err) {
        console.error("Failed to update customVolume:", err);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  console.log(
    "custom volume",
    customVolume,
    "volume",
    volume,
    "micEnabled",
    micEnabled,
    "mode",
    mode,
  );

  useEffect(() => {
    if (showResult && customVolume === 0) {
      volumeLockedRef.current = false;
      showResultRef.current = false;

      setVolume(0);
      setShowResult(false);
    }
  }, [customVolume, showResult]);

  return (
    <div className="home">
      <Header showResult={showResult} />

      <div className="content">
        {showResult ? (
          <Result />
        ) : (
          <>
            <Pillar side="left" volume={volume} />
            <Meter volume={volume} micEnabled={micEnabled} />
            <Pillar side="right" volume={volume} />
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
