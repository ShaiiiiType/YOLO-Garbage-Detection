from flask import Flask
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2
import serial
import base64
import threading
import time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")


config = {
    "model_path": None,
    "arduino_port": None,
    "confidence": 0.5
}

bbox_colors = [(164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106), 
              (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)]

model = None
arduino = None
cap = None
running = False
labels = None

cooldown_active = False
cooldown_start_time = 0
cooldown_duration = 5  # seconds
frozen_frame = None


@socketio.on("set_config")
def handle_set_config(data):
    global model, arduino, cap, running, config, labels
    config.update(data)

    model = YOLO(config["model_path"], task='detect')
    labels = model.names
    print(labels)

    try:
        arduino = serial.Serial(port=config["arduino_port"], baudrate=9600, timeout=1)
        time.sleep(2)  # wait for Arduino to reset
        print(f"Connected to Arduino on {config['arduino_port']}")
    except:
        arduino = None
        print("Arduino not found. Continuing without serial output.")

    cap = cv2.VideoCapture(0)
    running = True

    thread = threading.Thread(target=generate_frames)
    thread.daemon = True
    thread.start()

def generate_frames():
    global running, cooldown_active, cooldown_start_time, cooldown_duration, frozen_frame

    print("Now starting")
    
    while running:
        t_start = time.perf_counter()

        the_class = ''

        ret, frame = cap.read()
        if (frame is None) or (not ret):
            print('Unable to read frames from the camera. This indicates the camera is disconnected or not working. Exiting program.')
            break

        if cooldown_active:
            elapsed = time.time() - cooldown_start_time
            if elapsed < cooldown_duration:
                frame_to_send = frozen_frame.copy()
            else:
                cooldown_active = False
                frame_to_send = frame
        else:
            frame_to_send = frame

        results = model(frame_to_send, verbose=False)
        detections = results[0].boxes

        for i in range(len(detections)):
            xyxy_tensor = detections[i].xyxy.cpu() # Detections in Tensor format in CPU memory
            xyxy = xyxy_tensor.numpy().squeeze() # Convert tensors to Numpy array
            xmin, ymin, xmax, ymax = xyxy.astype(int) # Extract individual coordinates and convert to int

            # Get bounding box class ID and name
            classidx = int(detections[i].cls.item())
            classname = labels[classidx]

            # Get bounding box confidence
            conf = detections[i].conf.item()


            # Draw box if confidence threshold is high enough
            if conf > config["confidence"]:

                box_area = (xmax - xmin) * (ymax - ymin)
                frame_area = frame.shape[0] * frame.shape[1]
                area_ratio = box_area / frame_area

                # Skip boxes that are too large (e.g., > 50% of frame)
                # if area_ratio > 0.45:
                #     continue


                color = bbox_colors[classidx % 10]
                cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), color, 2)

                label = f'{classname}: {int(conf*100)}%'
                labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1) # Get font size
                label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
                cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), color, cv2.FILLED) # Draw white box to put label text in
                cv2.putText(frame, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1) # Draw label text

                if not cooldown_active:
                    cooldown_active = True
                    cooldown_start_time = time.time()
                    frozen_frame = frame.copy()

                if arduino:
                    if classname == "BIO" or classname == "PAPER":
                        arduino.write(b'BIODEGRADABLE\n')
                        print("Sent BIODEGRADABLE")
                    else:
                        arduino.write(b'NON-BIODEGRADABLE\n')
                        print("Sent NON-BIODEGRADABLE")

                if classname == "BIO" or classname == "PAPER":
                    the_class = 'BIO'
                else:
                    the_class = 'NON-BIO'
                    
        
        _, buffer = cv2.imencode('.jpg', frame_to_send)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        socketio.emit("frame", {"image": jpg_as_text, "class": the_class})


@socketio.on("stop")
def handle_stop():
    global running
    running = False
    if cap:
        cap.release()
    print("Detection stopped")


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)