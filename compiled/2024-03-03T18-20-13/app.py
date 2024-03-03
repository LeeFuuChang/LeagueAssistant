from PyQt5.QtWidgets import QApplication

import requests as rq
import threading
import waitress
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s | %(levelname)8s | %(message)s", "%Y-%m-%dT%H:%M:%S")
import atexit
import time
import sys
import os
setattr(sys, "kwargs", {k:v for k,v in [arg.split("=") for arg in sys.argv if "=" in arg]})
sys.kwargs["--mode"] = sys.kwargs.get("--mode", "RELEASE").upper()

from ProjectUtility import LOCAL_HOST, CLOUD_SERVER, ensureAdmin, getExecutableRoot
from modules import Client

cout_handler = logging.StreamHandler(sys.stdout)
cout_handler.setLevel(logging.DEBUG)
cout_handler.setFormatter(formatter)
logger.addHandler(cout_handler)

file_handler_path = os.path.join(getExecutableRoot(), "logs.log")
file_handler = logging.FileHandler(file_handler_path, "w")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

def handle_exception(exc_type, exc_value, exc_traceback):
    logger.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))
    try:
        logging.disable(logging.CRITICAL)
        with open(file_handler_path, "rb") as log_file:
            rq.post(f"{CLOUD_SERVER}/CrashReport", files={"Log":(file_handler_path, log_file)})
    except Exception as e:
        logger.error(f"Crash Log Upload Failed {e}")
    finally:
        logging.disable(logging.NOTSET)
sys.excepthook = handle_exception
def handle_exit():
    logger.info("Program exited")
atexit.register(handle_exit)


def run():
    logger.info("kwargs:", sys.kwargs)

    app = QApplication([*sys.argv, "--ignore-gpu-blacklist"])

    server = Client.Server.Server()
    host = LOCAL_HOST
    port = int(sys.kwargs.get("--port", Client.Server.getRandomPort()))

    threading.Thread(target=waitress.serve, daemon=True, kwargs={
        "app": server,
        "host": host, 
        "port": port, 
        "threads": int(sys.kwargs.get("--threads", 8)), 
    }).start()

    browserWindow = Client.Renderer.BrowserWindow()
    browserWindow.show()
    browserWindow.connect(server, host, port)

    phaseHandler = Client.PhaseHandler.PhaseHandler(server)
    def loop():
        while not time.sleep(1): 
            phaseHandler.update()
    threading.Thread(target=loop, daemon=True).start()

    sys.exit(app.exec_())


if __name__ == "__main__" and ensureAdmin(): run()