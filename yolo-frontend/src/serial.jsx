import React, { useState, useRef, useEffect } from 'react';
import { Button} from '@mui/material';

const WebSerialComponent = ({count, count1, count2}) => {
  const [port, setPort] = useState(null);
  const [connected, setConnected] = useState(false);
  const [dataReceived, setDataReceived] = useState([]);
  const readerRef = useRef(null);
  const writerRef = useRef(null);
  const isFirst = useRef(true)
  const isFirst1 = useRef(true)
  const isFirst2 = useRef(true)

  const connectSerialPort = async () => {
    try {
      const serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 9600 }); // Adjust baudRate as needed
      setPort(serialPort);
      setConnected(true);
      console.log('Serial port connected:', serialPort);
      
      writeToSerialPort('1')
      writeToSerialPort('1')

    } catch (error) {
      console.error('Error connecting to serial port:', error);
    }
  };

  const readSerialPort = async (serialPort) => {
    while (serialPort.readable) {
      readerRef.current = serialPort.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            // Allow the serial port to be closed later.
            readerRef.current.releaseLock();
            break;
          }
          const text = new TextDecoder().decode(value);
          setDataReceived((prevData) => [...prevData, text]);
          console.log('Received:', text); 
        }
      } catch (error) {
        console.error('Error reading from serial port:', error);
      } finally {
        readerRef.current.releaseLock();
      }
    }
  };

  const writeToSerialPort = async (data) => {
    if (!port) {
      console.warn('Serial port not connected.');
      return;
    }
    if (!port.writable) {
      console.warn('Serial port not writable.');
      return;
    }
    writerRef.current = port.writable.getWriter();
    try {
      const dataArray = new TextEncoder().encode(data);
      await writerRef.current.write(dataArray);
      console.log('Sent:', data);
    } catch (error) {
      console.error('Error writing to serial port:', error);
    } finally {
      writerRef.current.releaseLock();
    }
  };

  const disconnectSerialPort = async () => {
    if (port) {
      try {
        if (readerRef.current) {
          await readerRef.current.cancel();
        }
        await port.close();
        setPort(null);
        setConnected(false);
        setDataReceived([]);
        console.log('Serial port disconnected.');
      } catch (error) {
        console.error('Error disconnecting serial port:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      // Clean up on component unmount
      if (port && connected) {
        disconnectSerialPort();
      }
    };
  }, [port, connected]);

  useEffect(() => {
    return () => {
      if (isFirst.current) {
        isFirst.current = false     
      }
      else {
        writeToSerialPort('0')
      }
      
    };
  }, [count, port, connected]);

  useEffect(() => {
    return () => {
      if (isFirst1.current) {
        isFirst1.current = false     
      }
      else {
        writeToSerialPort('2')
      }
    };
  }, [count1, port, connected]);

  useEffect(() => {
    return () => {
      if (isFirst2.current) {
        isFirst2.current = false     
      }
      else {
        writeToSerialPort('1')
      }
    };
  }, [count2, port, connected]);

  return (
    <div>
      {!connected ? (
        <Button variant="contained" color="primary" onClick={connectSerialPort} size="small">
          Connect Serial Port
        </Button>
      ) : (
        <Button variant="outlined" color="secondary" onClick={disconnectSerialPort} size="small">
          Disconnect Serial Port
        </Button>
      )}
</div>
  );
};

export default WebSerialComponent;