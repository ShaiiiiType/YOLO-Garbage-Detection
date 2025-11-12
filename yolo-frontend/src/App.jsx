import { useState, useEffect, useRef } from 'react'
import WebCam, { socket } from './WebCam.jsx'
import Serial from './serial.jsx'

// import { serial_exports, new_data } from './serial.js'

function App() {
  const [count, setCount] = useState(0)
  const [count1, setCount1] = useState(0)
  const [count2, setCount2] = useState(0)
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
    socket.on("class", data => {
      if (data.classs == "BIO") {
        if (count < 10) {
          setCount(prevCount => prevCount + 1);
          setWhatClass("BIO")
          console.log(data.classs);
        }
      }
      else if (data.classs == "NON-BIO") {
        if (count1 < 10) {
          setCount1(prevCount => prevCount + 1);
          setWhatClass("NON-BIO")
          console.log(data.classs); 
        }
      }
      else {
        setCount1(prevCount => prevCount + 1);
        console.log('reset')
      }
      
    });
    return () => socket.off("class")
  }, [])

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

      <Serial count={count} count1={count1} count2={count2}/>

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
      <div className='bg-amber-950 w-[500px] h-[20px] m-2 flex relative'>
        <div className={`h-full bg-amber-300 transition-all duration-300`} style={{ width: `${(count / 10) * 100}%` }}></div>
        {(count == 10) && (
          <p className='absolute left-1/2 -translate-x-1/2 text-sm font-semibold'>BIO TRASH CAN FULL</p>
        )}
      </div>
      <div className='bg-amber-950 w-[500px] h-[20px] m-2 flex relative'>
        <div className={`h-full bg-amber-300 transition-all duration-300`} style={{ width: `${(count1 / 10) * 100}%` }}></div>
        {(count1 == 10) && (
          <p className='absolute left-1/2 -translate-x-1/2 text-sm font-semibold'>NON-BIO TRASH CAN FULL</p>
        )}
      </div>
      {/* <p>{whatClass}</p>
      <p>{count}</p>
      <p>{count1}</p>
       */}
    </>
  )
}

export default App
