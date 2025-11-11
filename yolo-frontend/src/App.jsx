import { useState, useEffect } from 'react'
import WebCam, { socket } from './WebCam.jsx'

function App() {
  const [count, setCount] = useState(0)
  const [count1, setCount1] = useState(0)
  const [modelPath, setModelPath] = useState("");
  const [comPort, setComPort] = useState("");
  const [confidence, setConfidence] = useState(0.5);
  const [status, setStatus] = useState("Not connected");
  const [hide, setHide] = useState(true);
  const [loading, setLoading] = useState(true);
  const [whatClass, setWhatClass] = useState("");

  useEffect(() => {
    socket.on("connect", () => setStatus("Connected to the backend"));
    socket.on("disconnect", () => setStatus("Connected to the backend"));
  }, []);

  useEffect(() => {
    if (whatClass == "BIO"){
      setCount(prevCount => prevCount + 1);
    } else if (whatClass == "NON-BIO") {
      setCount1(prevCount => prevCount + 1);
    }
  }, [whatClass]);

  const startDetection = () => {
    setHide(false);
    setLoading(true);
    socket.emit("set_config", {
      model_path: modelPath,
      arduino_port: comPort,
      confidence: confidence
    });
  }

  const stopDetection = () => {
    setHide(true);
    socket.emit("stop");
  }


  return (
    <>
      <p>
        { status }
      </p>

      <div>
        {/* TODO: Yung sa path, once na magawa siyang electron. From select folder na lang ung pag find nung path */}
        <input placeholder="YOLO model path" value={modelPath} onChange={e => setModelPath(e.target.value)} className='border-2 rounded-sm'/>
        <input placeholder="Arduino COM port" value={comPort} onChange={e => setComPort(e.target.value)} className='border-2 rounded-sm'/>
        <input type="number" step="0.1" min="0" max="1" value={confidence} onChange={e => setConfidence(parseFloat(e.target.value))} className='border-2 rounded-sm'/>
      </div>

      <div style={{ margin: "10px" }}>
        <button onClick={startDetection} className='border-2 rounded-sm'>Start Detection</button>
        <button onClick={stopDetection} className='border-2 rounded-sm'>Stop</button>
      </div>

      { !hide && (<WebCam loading={loading} setLoading={setLoading} setWhatClass={setWhatClass}/>)}
      <div className='bg-amber-950 w-[500px] h-[20px] m-2'>
        <div className={`h-full bg-amber-300 transition-all duration-300`} style={{ width: `${(count / 10) * 100}%` }}></div>

      </div>
      <div className='bg-amber-950 w-[500px] h-[20px] m-2 '>
        <div className={`h-full bg-amber-300 transition-all duration-300`} style={{ width: `${(count1 / 10) * 100}%` }}></div>

      </div>
      <p>{whatClass}</p>
      <p>{count}</p>
      <p>{count1}</p>
      
    </>
  )
}

export default App
