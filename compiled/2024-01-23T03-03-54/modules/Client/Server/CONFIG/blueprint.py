from ProjectUtility import PROJECT_NAME, STORAGE_SERVER, getDLL
from flask import Blueprint, send_from_directory, request, Response
import json
import os

Config = Blueprint("Config", __name__)

@Config.route("/<string:p0>/<string:p1>/<string:p2>/<string:name>", methods=["GET", "POST"])
def Config_Update(**kwargs):
    p0 = kwargs["p0"]
    p1 = kwargs["p1"]
    p2 = kwargs["p2"]
    name = kwargs["name"]
    StorageManager = getDLL("StorageManager")
    LocalStorage = getattr(StorageManager, "LocalStorage")
    if(request.method == "GET"):
        configPath = LocalStorage(STORAGE_SERVER, PROJECT_NAME).path(os.path.join("cfg", p0, p1, p2, name+".json"))
        if(not configPath): return Response(status=404)
        return send_from_directory(*os.path.split(configPath))
    elif(request.method == "POST"):
        try: data = request.get_json(force=True)
        except: data = {}
        configPath = LocalStorage(STORAGE_SERVER, PROJECT_NAME).path(os.path.join("cfg", p0, p1, p2, name+".json"))
        if(not configPath): return Response(status=404)
        with open(configPath, "a+") as f:
            f.seek(0)
            config = json.load(f)
            config.update(data)
            f.truncate(0)
            json.dump(config, f, indent=4, ensure_ascii=False)
        return Response(status=202)