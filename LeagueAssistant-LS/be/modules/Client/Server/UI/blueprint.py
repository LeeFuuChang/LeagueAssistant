from ProjectUtility import PROJECT_NAME, STORAGE_SERVER, getDLL
from flask import Blueprint, send_from_directory
import os

Ui = Blueprint("Ui", __name__)

@Ui.route("/")
def Ui_Root():
    StorageManager = getDLL("StorageManager")
    LocalStorage = getattr(StorageManager, "LocalStorage")
    fullpath = LocalStorage(STORAGE_SERVER, PROJECT_NAME).path(os.path.join("fe", "index.html"))
    return send_from_directory(*os.path.split(fullpath))

@Ui.route("assets/<path:filepath>")
def Ui_Assets(**kwargs):
    filepath = kwargs["filepath"]
    StorageManager = getDLL("StorageManager")
    LocalStorage = getattr(StorageManager, "LocalStorage")
    fullpath = LocalStorage(STORAGE_SERVER, PROJECT_NAME).path(os.path.join("fe", "assets", filepath))
    return send_from_directory(*os.path.split(fullpath))