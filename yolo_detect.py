import tkinter as tk
from tkinter import filedialog, messagebox
import threading
import cv2
from ultralytics import YOLO
from PIL import Image, ImageTk
import serial
import time

class YOLOApp:
    def __init__(self, root):
        self.root = root
        self.root.title("YOLO Detection App")
        self.root.geometry("900x700")

        # Variables
        self.model_path = tk.StringVar()
        self.port = tk.StringVar()
        self.running = False

        # UI Layout
        top_frame = tk.Frame(root)
        top_frame.pack(pady=10)

        tk.Label(top_frame, text="Model Path:").grid(row=0, column=0)
        tk.Entry(top_frame, textvariable=self.model_path, width=40).grid(row=0, column=1)
        tk.Button(top_frame, text="Browse", command=self.browse_model).grid(row=0, column=2)

        tk.Label(top_frame, text="Arduino Port:").grid(row=1, column=0)
        tk.Entry(top_frame, textvariable=self.port).grid(row=1, column=1)

        tk.Button(top_frame, text="Start", command=self.start_detection, bg="green", fg="white").grid(row=2, column=0, pady=10)
        tk.Button(top_frame, text="Stop", command=self.stop_detection, bg="red", fg="white").grid(row=2, column=1, pady=10)

        # Image Display
        self.video_label = tk.Label(root)
        self.video_label.pack()

        self.model = None
        self.cap = None
        self.arduino = None

    def browse_model(self):
        path = filedialog.askopenfilename(filetypes=[("YOLO model", "*.pt")])
        if path:
            self.model_path.set(path)

    def start_detection(self):
        if not self.model_path.get():
            messagebox.showerror("Error", "Please select a YOLO model file.")
            return
        self.running = True
        thread = threading.Thread(target=self.run_detection)
        thread.daemon = True
        thread.start()

    def stop_detection(self):
        self.running = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        self.video_label.config(image='')

    def run_detection(self):
        # Load model
        self.model = YOLO(self.model_path.get())
        # Try Arduino
        try:
            self.arduino = serial.Serial(port=self.port.get(), baudrate=9600, timeout=1)
            time.sleep(2)
            print("Connected to Arduino")
        except:
            print("No Arduino detected")

        self.cap = cv2.VideoCapture(0)
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                break

            results = self.model(frame)
            detections = results[0].boxes

            for det in detections:
                conf = det.conf.item()
                if conf > 0.3:
                    cls = int(det.cls.item())
                    label = self.model.names[cls]
                    xyxy = det.xyxy[0].cpu().numpy().astype(int)
                    cv2.rectangle(frame, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), (0,255,0), 2)
                    cv2.putText(frame, label, (xyxy[0], xyxy[1]-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)
                    if self.arduino:
                        if label in ["BIODEGRADABLE", "CARDBOARD", "PAPER"]:
                            self.arduino.write(b'BIODEGRADABLE\n')
                        else:
                            self.arduino.write(b'NON-BIODEGRADABLE\n')

            # Convert BGR→RGB and show in Tkinter Label
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame)
            imgtk = ImageTk.PhotoImage(image=img)
            self.video_label.imgtk = imgtk
            self.video_label.configure(image=imgtk)

            # Smooth refresh rate
            self.root.update_idletasks()
            self.root.update()

        self.cap.release()

root = tk.Tk()
app = YOLOApp(root)
root.mainloop()