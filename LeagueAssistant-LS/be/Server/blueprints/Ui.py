from flask import Blueprint, send_file
import sys
import os

Ui = Blueprint("Ui", __name__)

@Ui.route("/")
def Ui_Root():
    LocalStorage = getattr(sys.modules["StorageManager"], "LocalStorage")
    return send_file(LocalStorage.path(os.path.join("fe", "index.html")))

@Ui.route("assets/<path:filepath>")
def Ui_Assets(**kwargs):
    LocalStorage = getattr(sys.modules["StorageManager"], "LocalStorage")
    return send_file(LocalStorage.path(os.path.join("fe", "assets", kwargs["filepath"])))
