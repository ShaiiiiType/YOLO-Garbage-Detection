import React, { useEffect, useState, useRef } from 'react'
import { io } from "socket.io-client"

export const socket = io("http://localhost:5000/");

function WebCam({ loading, setLoading, setWhatClass }){
    const webcamRef = useRef(null);

    useEffect(() => {
        socket.on("frame", data => {
            if (webcamRef.current) webcamRef.current.src = "data:image/jpeg;base64," + data.image;
            setWhatClass(data.class);
            setLoading(false);
        });
    }, []);

    return (
        <div className="relative w-[720px] h-[480px]">
            {loading && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-75 text-white z-10">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-green-400 rounded-full animate-spin mb-4"></div>
                <span className="text-lg font-semibold">Loading camera...</span>
                </div>
            )}
            <img ref={webcamRef} className={`${loading ? "hidden" : "block"}`}></img>
        </div>
    );
}

export default WebCam