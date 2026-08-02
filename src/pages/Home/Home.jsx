import "./Home.scss";

import { useEffect, useState, useRef } from "react";

import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";
import Result from "../../components/Result/Result";
import { db } from "../../firebase-config";
import { onSnapshot, doc } from "firebase/firestore";

// Helper function to handle mic threshold & enforce 75 max cap
const processMicVolume = (rawVolume) => {
  const THRESHOLD = 5;
  const MAX_MIC_OUTPUT = 75;

  // 1. Below threshold = 0 (silence background noise)
  if (rawVolume <= THRESHOLD) {
    return 0;
  }

  // 2. Map 5-100 raw input into 0-75 output range
  const scaled = ((rawVolume - THRESHOLD) / (100 - THRESHOLD)) * MAX_MIC_OUTPUT;

  // Max output from mic can never pass 75
  return Math.min(MAX_MIC_OUTPUT, Math.round(scaled));
};

const Home = () => {
  const [volume, setVolume] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [backupGainEnabled, setBackupGainEnabled] = useState(false);
  const [backupGain, setBackupGain] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  // Sync state & manual volume overrides from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "dulcoflex-excitometer", "excitometer"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setMicEnabled(data.micEnabled ?? false);
          setBackupGainEnabled(data.backupGainEnabled ?? false);
          setBackupGain(data.backupGain ?? 20);

          // If Admin updates manualVolume directly from Admin Panel (e.g., 0-100)
          if (data.manualVolume !== undefined) {
            setVolume(data.manualVolume);
          }
        }
      },
    );

    return unsubscribe;
  }, []);

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
      console.log(err);
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

    // Raw calculated sound input (0-100)
    const rawVolume = Math.min(100, Math.round(rms * 350));

    // Process noise threshold (<5 -> 0) and clamp max mic volume to 75
    let micVolume = processMicVolume(rawVolume);

    // Apply optional backup gain boost
    let finalVolume = backupGainEnabled ? micVolume + backupGain : micVolume;

    // Smooth transition & zero-out clean thresholds
    setVolume((prev) => {
      if (finalVolume === 0) return 0;

      let smoothed = Math.round(prev * 0.8 + finalVolume * 0.2);

      // Clean snapping at boundaries
      if (smoothed <= 2) smoothed = 0;

      return smoothed;
    });

    animationRef.current = requestAnimationFrame(updateVolume);
  };

  // Trigger Result screen on reaching 100% (Admin Controlled)
  useEffect(() => {
    if (volume >= 100) {
      setShowResult(true);
      stopMic();
    } else if (volume < 100 && showResult) {
      setShowResult(false);
    }
  }, [volume, showResult]);

  // Manage mic state lifecycle
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
  }, [micEnabled, backupGainEnabled, backupGain, showResult]);

  useEffect(() => {
    console.log(volume);
    console.log(micEnabled, backupGain, "mic enabled");
  }, [volume, micEnabled, backupGain]);

  return (
    <div className="home">
      <Header />

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
