import React, { useEffect, useRef } from "react";
const App = () => {
  const recording = document.createElement("recording");

  let recordingTimeMS = 5000;

  const videoRef = useRef(null);
  const photoRef = useRef(null);
  const stripRef = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    getVideo();
  }, [videoRef]);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 250 } })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .then(() => startRecording(recording.captureStream(), recordingTimeMS))
      .then((recordedChunks) => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        recording.src = URL.createObjectURL(recordedBlob);
        recording.href = recording.src;
        recording.download = "RecordedVideo.webm";

        // log(`Successfully recorded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`);
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const wait = (delayInMS) => {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
  };

  function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();
    // log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    });

    return Promise.all([stopped, recorded]).then(() => data);
  }

  function stop(stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  const paintToCanvas = () => {
    let video = videoRef.current;
    let photo = photoRef.current;
    let ctx = photo.getContext("2d");

    const width = 320;
    const height = 240;
    photo.width = width;
    photo.height = height;

    return setInterval(() => {
      let color = colorRef.current;

      ctx.drawImage(video, 0, 0, width, height);
      let pixels = ctx.getImageData(0, 0, width, height);

      color.style.backgroundColor = `rgb(${pixels.data[0]},${pixels.data[1]},${pixels.data[2]})`;
      color.style.borderColor = `rgb(${pixels.data[0]},${pixels.data[1]},${pixels.data[2]})`;
    }, 200);
  };

  const takePhoto = () => {
    let photo = photoRef.current;
    let strip = stripRef.current;

    const data = photo.toDataURL("image/jpeg");

    console.warn(data);
    const link = document.createElement("a");
    link.href = data;
    link.setAttribute("download", "myWebcam");
    link.innerHTML = `<img src='${data}' alt='thumbnail'/>`;
    strip.insertBefore(link, strip.firstChild);
  };

  // const recordVideo = () => {
  //   let video = getVideo();
  //   let strip = stripRef.current;
  //   const data = video.toDataURL("video/webm");

  //   console.warn(data);
  //   const link = document.createElement("a");
  //   link.href = data;
  //   link.setAttribute("download", "myWebcam");
  //   link.innerHTML = `<video controls width="250" src='${data}' alt='thumbnail'/>`;

  //   strip.insertBefore(link, strip.firstChild);
  // };

  const myStyle = {
    backgroundImage:
      "url('https://images.unsplash.com/photo-1589670301572-734d642c53d2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2970&q=80')",
    height: "100vh",
    // marginTop:'-70px',
    // fontSize:'50px',
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="container">
      <div ref={colorRef} className="scene" style={myStyle}>
        <div className="webcam-video">
          <button onClick={() => takePhoto()}>Take a photo</button>
          <video
            onCanPlay={() => paintToCanvas()}
            ref={videoRef}
            className="player"
          />
          <canvas ref={photoRef} className="photo" />
          <div className="photo-booth">
            <div ref={stripRef} className="strip" />
          </div>
        </div>
      </div>

      <button onClick={() => startRecording()}>Start Recording</button>
      <button onClick={() => stop()}>Stop Recording</button>
    </div>
  );
};

export default App;
