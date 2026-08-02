import { useEffect, useRef, useState } from "react";

export default function Excitometer() {
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
    <div style={{ padding: 30 }}>
      <h1>Excitometer</h1>

      <h2>{volume}</h2>

      <div
        style={{
          width: "100%",
          height: 30,
          background: "#ddd",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            width: `${volume}%`,
            height: "100%",
            background: volume < 40 ? "green" : volume < 70 ? "orange" : "red",
            transition: "0.05s",
          }}
        />
      </div>
    </div>
  );
}
