from ProjectUtility import PROJECT_NAME, STORAGE_SERVER, getDLL
from flask import Blueprint, send_from_directory, Response
import requests as rq
import os

Storage = Blueprint("Storage", __name__)

@Storage.route("/cloud/<path:filepath>", methods=["GET"])
def Storage_Cloud(**kwargs):
    filepath = kwargs["filepath"]
    fullpath = os.path.join(STORAGE_SERVER, filepath)
    response = rq.get(fullpath.replace("\\", "/"), stream=True)
    return Response(response.text, content_type=response.headers["Content-Type"])

@Storage.route("/local/<path:filepath>", methods=["GET"])
def Storage_Local(**kwargs):
    filepath = kwargs["filepath"]
    StorageManager = getDLL("StorageManager")
    LocalStorage = getattr(StorageManager, "LocalStorage")
    fullpath = LocalStorage(STORAGE_SERVER, PROJECT_NAME).path(filepath)
    return send_from_directory(*os.path.split(fullpath))

@Storage.route("/riot/<path:filepath>", methods=["GET"])
def Storage_Riot(**kwargs):
    filepath = kwargs["filepath"]
    fullpath = os.path.join(os.environ["LOL_INSTALL_DIRECTORY"], filepath)
    if(not os.path.exists(fullpath)): return Response(status=404)
    if(os.path.isdir(fullpath)): return os.listdir(fullpath)
    return send_from_directory(*os.path.split(fullpath))