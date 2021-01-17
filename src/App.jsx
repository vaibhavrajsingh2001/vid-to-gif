import React, { useState, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import './App.css';

const ffmpeg = createFFmpeg({ log: true });

function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [gif, setGif] = useState();
  const [vidDuration, setVidDuration] = useState(0);
  const [gifDuration, setGifDuration] = useState(1);
  const [gifStart, setGifStart] = useState(0);
  const [loading, setLoading] = useState(false);
  const [percentageCompletion, setPercentageCompletion] = useState(0);

  const loadFFmpeg = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  const converter = async () => {
    setLoading(true);
    // FFmpeg manages its own file system, so load file into it & name it something
    ffmpeg.FS('writeFile', 'temp.mp4', await fetchFile(video));

    ffmpeg.setProgress(({ ratio }) => {
      if (ratio < 0.1) {
        setPercentageCompletion(Math.floor(ratio * 1000));
      }
    });
    /* 
    Run FFmpeg command (works similar to CLI, pass values to flag)
     -i : input file
     -t : duration of output file
     -ss : offset, at which point of input file it'll start
     -f : output format & name
    */
    await ffmpeg.run(
      '-i',
      'temp.mp4',
      '-t',
      `${gifDuration}`,
      '-ss',
      `${gifStart}`,
      '-f',
      'gif',
      'output.gif',
    );

    // Read the output file from FFmpeg file system
    const gifData = ffmpeg.FS('readFile', 'output.gif');

    // Make a URL from the file to show on frontend (by making a blob from the file and giving a MIME type)
    const gifURL = URL.createObjectURL(
      new Blob([gifData.buffer], { type: 'image/gif' }),
    );

    setLoading(false);
    setGif(gifURL);
  };

  useEffect(() => {
    loadFFmpeg();
  }, []);

  if (ready) {
    return (
      <div className="App">
        <input
          className="fileInput"
          type="file"
          name="video_input"
          onChange={(e) => setVideo(e.target.files?.item(0))}
        />

        {/* URL.createObjectURL takes a obj (file in this case) and makes a URL out of it so it can be assigned to a src tag */}

        {video && !loading && !gif && (
          <>
            <video
              className="video"
              controls
              width="500"
              src={URL.createObjectURL(video)}
              onLoadedMetadata={(e) =>
                setVidDuration(Math.floor(e.target.duration))
              }
            ></video>

            <div className="gif__data">
              <p>Choose duration of GIF </p>
              <input
                type="range"
                name="GIF_duration"
                min="0"
                max={vidDuration}
                value={gifDuration}
                onChange={(e) => setGifDuration(e.target.value)}
              />
              <p>Current duration: {gifDuration} seconds</p>
            </div>
            <div className="gif__data">
              <p>Choose start point of GIF</p>
              <input
                type="range"
                name="GIF_start"
                min="0"
                max={vidDuration}
                value={gifStart}
                onChange={(e) => setGifStart(e.target.value)}
              />
              <p>Current start point: {gifStart} seconds</p>
            </div>
            <button className="convert__btn" onClick={converter}>
              Convert!
            </button>
          </>
        )}

        {loading && (
          <>
            <h3>{percentageCompletion}% done: </h3>
            <div className="loader"></div>
          </>
        )}

        {gif && (
          <div>
            <h3>Result GIF:</h3>
            <img width="500" src={gif} />
          </div>
        )}
      </div>
    );
  }

  return <p>Awesome WASM is loading...</p>;
}

export default App;
