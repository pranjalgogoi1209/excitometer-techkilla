import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";

import "./Home.scss";
import { useEffect, useState, useRef } from "react";

const Home = () => {
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const startMic = async () => {
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
    startMic();

    return () => {
      cancelAnimationFrame(animationRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    console.log(volume);
  }, [volume]);

  return (
    <div className="home">
      <Header />

      <div className="content">
        <Pillar side="left" />

        <Meter />

        <Pillar side="right" />
      </div>
    </div>
  );
};

export default Home;
