import "./Home.scss";

import { useEffect, useState, useRef } from "react";

import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";
import { db } from "../../firebase-config";
import { onSnapshot, doc } from "firebase/firestore";

const Home = () => {
  const [volume, setVolume] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [backupGainEnabled, setBackupGainEnabled] = useState(false);
  const [backupGain, setBackupGain] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "dulcoflex-excitometer", "excitometer"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setMicEnabled(data.micEnabled ?? false);
          setBackupGainEnabled(data.backupGainEnabled ?? false);
          setBackupGain(data.backupGain ?? 20);
        }
      },
    );

    return unsubscribe;
  }, []);

  const stopMic = async () => {
    cancelAnimationFrame(animationRef.current);

    animationRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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

    setVolume(0);
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

    // Actual crowd volume
    const actualVolume = Math.min(100, Math.round(rms * 350));

    // Apply backup gain as a boost
    const finalVolume = backupGainEnabled
      ? Math.min(100, actualVolume + backupGain)
      : actualVolume;

    let displayVolume = finalVolume;

    // Clamp before smoothing
    if (displayVolume <= 2) {
      displayVolume = 0;
    }

    if (displayVolume >= 98) {
      displayVolume = 100;
    }

    // Smooth animation and clamp again
    setVolume((prev) => {
      let smoothed = Math.round(prev * 0.8 + displayVolume * 0.2);

      if (smoothed <= 2) smoothed = 0;
      if (smoothed >= 98) smoothed = 100;

      return smoothed;
    });

    animationRef.current = requestAnimationFrame(updateVolume);
  };

  useEffect(() => {
    let mounted = true;

    const restartMic = async () => {
      await stopMic();

      if (mounted && micEnabled) {
        await startMic();
      }
    };

    restartMic();

    return () => {
      mounted = false;
      stopMic();
    };
  }, [micEnabled, backupGainEnabled, backupGain]);

  useEffect(() => {
    console.log(volume);
    console.log(micEnabled, backupGain, "mic enabled");
  }, [volume, micEnabled]);

  return (
    <div className="home">
      <Header />

      <div className="content">
        <Pillar side="left" volume={volume} />

        <Meter volume={volume} />

        <Pillar side="right" volume={volume} />
      </div>
    </div>
  );
};

export default Home;
