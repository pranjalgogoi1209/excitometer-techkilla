import React, { useRef, useState, useEffect } from "react";
import Confetti from "react-confetti";
import "./Result.scss";

const Result = () => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  return (
    <div className="result" ref={containerRef}>
      {dimensions.width > 0 && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          numberOfPieces={200}
          recycle={true}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      )}

      <h1 className="result__text">
        Together, let’s make <br />
        this smart solution <br />
        bigger!
      </h1>
    </div>
  );
};

export default Result;
