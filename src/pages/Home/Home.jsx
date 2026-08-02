import "./Home.scss";

import { useEffect, useState, useRef } from "react";

import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";
import Result from "../../components/Result/Result";
import { db } from "../../firebase-config";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";

// Helper function to handle mic threshold & enforce 75 max cap
const processMicVolume = (rawVolume) => {
  const THRESHOLD = 5;
  const MAX_MIC_OUTPUT = 75;

  if (rawVolume <= THRESHOLD) {
    return 0;
  }

  const scaled = ((rawVolume - THRESHOLD) / (100 - THRESHOLD)) * MAX_MIC_OUTPUT;
  return Math.min(MAX_MIC_OUTPUT, Math.round(scaled));
};

const Home = () => {
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
    let micVolume = processMicVolume(rawVolume);

    if (customVolumeRef.current > 0) {
      setVolume(customVolumeRef.current);
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

        if (!isMicEnabled) {
          setVolume(currentCustomVol);
        }

        // Handle decay if customVolume > 0
        if (currentCustomVol > 0) {
          if (decayTimeout) clearTimeout(decayTimeout);

          decayTimeout = setTimeout(async () => {
            try {
              setCustomVolume(0);

              if (!isMicEnabled && !showResultRef.current) {
                setVolume(0);
              }

              await updateDoc(docRef, { customVolume: 0 });
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
    console.log("volume from useeffect", volume);
    if (volume >= 100 && !showResult) {
      setShowResult(true);
      showResultRef.current = true; // Lock the result state
      stopMic();
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
