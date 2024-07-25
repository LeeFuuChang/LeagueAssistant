from flask import Flask
import logging
import socket

# for app
from .AD import Ad
from .APP import App
from .CONFIG import Config
from .STORAGE import Storage
from .UI import Ui

# for api
from .RIOT import Riot

# for static
from .CDRAGON import Cdragon
from .DDRAGON import Ddragon

# for statistics
from .OPGG import Opgg
from .QQ import Qq


def getRandomPort():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("localhost", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


class WebServer(Flask):
    host = "localhost"
    port = getRandomPort()

    def registerAppControl(self, name, func):
        self.blueprints["app"].control_functions[name] = func

    def __init__(self):
        super(self.__class__, self).__init__(__name__)

        self.appControls = {}

        self.appBlueprints = {bp.name.lower():bp for bp in [
            # for app
            Ad, App, Config, Storage, Ui, 

            # for api
            Riot, 

            # for static
            Cdragon, Ddragon, 

            # for statistics
            Opgg, Qq, 
        ]}
        for name in self.appBlueprints:
            self.blueprints[name] = self.appBlueprints[name]
            self.register_blueprint(self.appBlueprints[name], url_prefix=f"/{name}")

        logging.info(f"Server Initlized on ({self.host}, {self.port})")
