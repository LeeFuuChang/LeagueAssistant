from flask import Blueprint, Response, send_file
import os


Storage = Blueprint("Storage", __name__)


@Storage.route("/riot/<path:filepath>", methods=["GET"])
def Storage_Riot(**kwargs):
    fullpath = os.path.join(os.environ["LOL_INSTALL_DIRECTORY"], kwargs["filepath"])
    if(not os.path.exists(fullpath)): return Response(status=404)
    if(os.path.isdir(fullpath)): return os.listdir(fullpath)
    return send_file(fullpath)
