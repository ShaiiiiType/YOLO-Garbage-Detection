import { useState, useEffect, useRef } from 'react'
import WebCam, { socket } from './WebCam.jsx'
import Serial from './serial.jsx'
import { Button, TextField, Box, LinearProgress, Typography, Stack, Slider, Divider, Grid, Chip, Card } from '@mui/material';

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
        setCount2(prevCount => prevCount + 1);
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', my: 4 }}>
      <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>WASTE SEGREGATION</Typography>
      </Box>
    <Grid container spacing={4} justifyContent="center" >
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
      <Stack spacing={3} sx={{ p: 3, width: 600, mx: 'auto' }}>
        {/* Status */}
        {/* <Typography variant="subtitle1" color="text.secondary">
          {status}
        </Typography> */}


        <Chip label={status} variant='outlined' color={status === "Not connected to the backend" ? "" : "success"} />

        {/* Serial counts
        <Serial count={count} count1={count1} count2={count2} /> */}

        {/* Input fields */}
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={8}>
              <TextField
                label="YOLO Model Path"
                variant="outlined"
                fullWidth
                size="small"
                value={modelPath}
                onChange={(e) => setModelPath(e.target.value)}
              />
            </Grid>
            <Grid size={4}>
              <Serial count={count} count1={count1} count2={count2} />
            </Grid>
          </Grid>
          {/* <TextField
            label="Arduino COM Port"
            variant="outlined"
            fullWidth
            size="small"
            value={comPort}
            onChange={(e) => setComPort(e.target.value)}
          /> */}
          <Box>
            <Typography gutterBottom>Confidence: {confidence.toFixed(2)}</Typography>
            <Slider
              value={confidence}
              min={0}
              max={1}
              step={0.01} // allows values like 0.01, 0.42, 0.87, etc.
              onChange={(e, val) => setConfidence(val)}
              valueLabelDisplay="auto" // shows current value on thumb
            />
          </Box>
        </Stack>

        {/* Control buttons */}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="primary" onClick={startDetection}>
            Start Detection
          </Button>
          <Button variant="outlined" color="secondary" onClick={stopDetection}>
            Stop
          </Button>
        </Stack>

        {/* Webcam
        {!hide && <WebCam loading={loading} setLoading={setLoading} setWhatClass={setWhatClass} />} */}

        {/* Trash can progress bars */}
        <Box>
          <Typography variant="body2" gutterBottom>
            BIO TRASH CAN CAPACITY
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(count / 10) * 100}
            sx={{ height: 20, borderRadius: 1 }}
          />
          {count === 10 && (
            <Typography
              variant="caption"
              sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', mt: -2 }}
            >
              FULL
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom>
            NON-BIO TRASH CAN CAPACITY
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(count1 / 10) * 100}
            sx={{ height: 20, borderRadius: 1 }}
          />
          {count1 === 10 && (
            <Typography
              variant="caption"
              sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', mt: -2 }}
            >
              FULL
            </Typography>
          )}
        </Box>
        
      </Stack>
      </Card>
      </Grid>
      <Grid item xs={12} md={8} >
          {!hide && <WebCam loading={loading} setLoading={setLoading} setWhatClass={setWhatClass} />}
        </Grid>
    </Grid>
    </Box>
  )
}

export default App
