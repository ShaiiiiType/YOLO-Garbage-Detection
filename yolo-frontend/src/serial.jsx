import React, { useState, useRef, useEffect } from 'react';

const WebSerialComponent = ({count, count1, count2}) => {
  const [port, setPort] = useState(null);
  const [connected, setConnected] = useState(false);
  const [dataReceived, setDataReceived] = useState([]);
  const readerRef = useRef(null);
  const writerRef = useRef(null);

  const connectSerialPort = async () => {
    try {
      const serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 9600 }); // Adjust baudRate as needed
      setPort(serialPort);
      setConnected(true);
      console.log('Serial port connected:', serialPort);

      // Start reading from the port
      // readSerialPort(serialPort);
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
    if (!port || !port.writable) {
      console.warn('Serial port not connected or not writable.');
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
      writeToSerialPort("0")
    };
  }, [count]);

  useEffect(() => {
    return () => {
      writeToSerialPort("2")
    };
  }, [count1]);

  useEffect(() => {
    return () => {
      writeToSerialPort("1")
    };
  }, [count2]);

  return (
    <div>
      <h1>Web Serial API with React</h1>
      {!connected ? (
        <button onClick={connectSerialPort}>Connect Serial Port</button>
      ) : (
        <button onClick={disconnectSerialPort}>Disconnect Serial Port</button>
      )}

      {connected && (
        <div>
          <input
            type="text"
            placeholder="Enter data to send"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                writeToSerialPort(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button onClick={() => writeToSerialPort('0')}>Send "Hello"</button>
          <button onClick={() => writeToSerialPort('1')}>Send "Hello"</button>
          <button onClick={() => writeToSerialPort('2')}>Send "Hello"</button>
        </div>
      )}

      {/* <h2>Received Data:</h2>
      <pre>{dataReceived.join('')}</pre> */}
    </div>
  );
};

export default WebSerialComponent;