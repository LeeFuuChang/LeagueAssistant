from flask import Flask, redirect
import logging
import socket

# for app
from .blueprints.Ad import Ad
from .blueprints.App import App
from .blueprints.Config import Config
from .blueprints.Storage import Storage
from .blueprints.Ui import Ui

# for api
from .blueprints.Riot import Riot

# for static
from .blueprints.CDragon import CDragon
from .blueprints.DDragon import DDragon

# for statistics
from .blueprints.Opgg import Opgg
from .blueprints.Qq import Qq


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

        self.add_url_rule("/", endpoint="ui", view_func=lambda:redirect("/ui"))
        for bp in [Ad, App, Config, Storage, Ui, Riot, CDragon, DDragon, Opgg, Qq]:
            name = bp.name.lower() 
            self.blueprints[name] = bp
            self.register_blueprint(bp, url_prefix=f"/{name}")

        logging.info(f"Server Initlized on ({self.host}, {self.port})")
