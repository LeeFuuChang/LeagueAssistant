from PyQt5.QtWidgets import QApplication

import threading
import waitress
import logging
import time
import sys

from modules import Client

def run():
    logging.info("kwargs:", sys.kwargs)

    app = QApplication([*sys.argv, "--ignore-gpu-blacklist"])

    server = Client.Server.Server()

    if("--server" in sys.argv):
        return server.run(
            host=server.host,
            port=server.port,
            threaded=True,
        )

    threading.Thread(target=waitress.serve, daemon=True, kwargs={
        "app": server,
        "host": server.host, 
        "port": server.port, 
        "threads": int(sys.kwargs.get("--threads", 8)), 
    }).start()

    browserWindow = Client.WebRenderer()
    browserWindow.show()
    browserWindow.connect(server, server.host, server.port)

    phaseHandler = Client.PhaseHandler(server)
    def loop():
        while not time.sleep(1): 
            phaseHandler.update()
    threading.Thread(target=loop, daemon=True).start()

    sys.exit(app.exec_())
