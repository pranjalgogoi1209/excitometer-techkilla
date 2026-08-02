import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";
import { db } from "../../firebase-config";
import { onSnapshot, doc } from "firebase/firestore";
import "./Home.scss";
import { useEffect, useState, useRef } from "react";

const Home = () => {
  const [volume, setVolume] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [backupGainEnabled, setBackupGainEnabled] = useState(false);
  const [backupGain, setBackupGain] = useState(20);

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
          setMicEnabled(snapshot.data().micEnabled);
        }
      },
    );

    return unsubscribe;
  }, []);

  const stopMic = async () => {
    cancelAnimationFrame(animationRef.current);

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

    analyser.getFloatTimeDomainData(dataArray);

    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }

    const rms = Math.sqrt(sum / dataArray.length);

    // Convert RMS -> Meter (0-100)
    let meter = Math.min(100, Math.round(rms * 350));

    // Smooth animation
    setVolume((prev) => Math.round(prev * 0.8 + meter * 0.2));

    animationRef.current = requestAnimationFrame(updateVolume);
  };

  useEffect(() => {
    if (micEnabled) {
      startMic();
    } else {
      stopMic();
    }

    return () => {
      stopMic();
    };
  }, [micEnabled]);

  useEffect(() => {
    console.log(volume);
    console.log(micEnabled, "mic enabled");
  }, [volume, micEnabled]);

  return (
    <div className="home">
      <Header />

      <div className="content">
        <Pillar side="left" volume={volume} />

        <Meter />

        <Pillar side="right" volume={volume} />
      </div>
    </div>
  );
};

export default Home;
