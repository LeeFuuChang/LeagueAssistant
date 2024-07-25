from flask import Blueprint, send_from_directory
import sys
import os

Ui = Blueprint("Ui", __name__)

@Ui.route("/")
def Ui_Root():
    LocalStorage = getattr(sys.modules["StorageManager"], "LocalStorage")
    fullpath = LocalStorage.path(os.path.join("fe", "index.html"))
    return send_from_directory(*os.path.split(fullpath))

@Ui.route("assets/<path:filepath>")
def Ui_Assets(**kwargs):
    LocalStorage = getattr(sys.modules["StorageManager"], "LocalStorage")
    fullpath = LocalStorage.path(os.path.join("fe", "assets", kwargs["filepath"]))
    return send_from_directory(*os.path.split(fullpath))
