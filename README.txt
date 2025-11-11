Run these first:
1. Set up env folder:
    Run: "python -m venv env"
2. Run it by    "env\Scripts\activate" if you're using windows
                "source env/bin/activate" if you're using Linux or Mac
3. Install all dependencies by: 
                pip install -r requirements.txt
4. To test the camera detection:
                Run: "python yolo_detect.py --model=garbage_yolo_model_v2/garbage_yolo_model_v2.pt --source=usb0 --resolution=1280x720 --port=<COM>"

                Final: python yolo_detect.py --model=garbage_yolo_model_v3/garbage_yolo_model_v3.pt --source=usb0 --resolution=1280x720 --port=<COM>