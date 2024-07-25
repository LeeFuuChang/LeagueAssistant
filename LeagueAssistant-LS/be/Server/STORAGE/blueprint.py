from flask import Blueprint, send_from_directory, Response
import requests as rq
import sys
import os

Storage = Blueprint("Storage", __name__)

@Storage.route("/cloud/<path:filepath>", methods=["GET"])
def Storage_Cloud(**kwargs):
    filepath = kwargs["filepath"]
    fullpath = os.path.join(os.environ["STORAGE_URL"], filepath)
    response = rq.get(fullpath.replace("\\", "/"), stream=True)
    return Response(response.text, content_type=response.headers["Content-Type"])

@Storage.route("/local/<path:filepath>", methods=["GET"])
def Storage_Local(**kwargs):
    LocalStorage = getattr(sys.modules["StorageManager"], "LocalStorage")
    fullpath = LocalStorage.path(kwargs["filepath"])
    return send_from_directory(*os.path.split(fullpath))

@Storage.route("/riot/<path:filepath>", methods=["GET"])
def Storage_Riot(**kwargs):
    filepath = kwargs["filepath"]
    fullpath = os.path.join(os.environ["LOL_INSTALL_DIRECTORY"], filepath)
    if(not os.path.exists(fullpath)): return Response(status=404)
    if(os.path.isdir(fullpath)): return os.listdir(fullpath)
    return send_from_directory(*os.path.split(fullpath))