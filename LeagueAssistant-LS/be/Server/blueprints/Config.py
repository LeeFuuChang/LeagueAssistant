from flask import Blueprint, send_from_directory, request, Response
import json
import sys
import os


Config = Blueprint("Config", __name__)


@Config.route("/<string:p0>/<string:p1>/<string:p2>/<string:name>", methods=["GET", "POST"])
def Config_Update(**kwargs):
    relpath = os.path.join("cfg", kwargs["p0"], kwargs["p1"], kwargs["p2"], f"{kwargs['name']}.json")
    configPath = sys.modules["StorageManager"].LocalStorage.path(relpath)

    if(not configPath): return Response(status=404)

    if(request.method == "GET"):
        return send_from_directory(*os.path.split(configPath))

    if(request.method == "POST"):
        with open(configPath, "a+") as f:
            f.seek(0)
            config = json.load(f)
            config.update(request.form)
            f.truncate(0)
            json.dump(config, f, indent=4, ensure_ascii=False)
        return Response(status=202)
