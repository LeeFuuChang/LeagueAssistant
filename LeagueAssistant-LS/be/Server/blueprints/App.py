from flask import Blueprint, Response, send_from_directory, request
import requests as rq
import webbrowser
import random
import json
import sys
import os


App = Blueprint("App", __name__)


@App.route("/version", methods=["GET"])
def App_Version():
    versionPath = sys.modules["StorageManager"].LocalStorage.path("storage.version")
    if(not versionPath or not os.path.exists(versionPath)): return Response(status=404)

    with open(versionPath, "r") as f: currentVersion = f.read()

    latest = rq.get(f"{os.environ['SERVER_URL']}/Version").json()

    return {
        "current-version": currentVersion,
        "latest-version": latest["version"],
        "release-date": latest["last-edit"],
    }


@App.route("/ad", methods=["GET"])
def App_Ad():
    try: data = rq.get(f"{os.environ['SERVER_URL']}/Ads").json()
    except: data = []
    return {} if(not data)else random.choice(data)


@App.route("/external", methods=["POST"])
def App_External():
    if("url" not in request.form): return Response(status=404)
    webbrowser.open(str(request.form["url"]))
    return Response(status=202)


@App.route("/config/<path:filepath>", methods=["GET", "POST"])
def App_Config(**kwargs):
    if(not kwargs.get("filepath", None)): return Response(status=404)

    configPath = sys.modules["StorageManager"].LocalStorage.path(os.path.join("cfg", kwargs["filepath"]))

    if(not configPath): return Response(status=404)

    if(os.path.isdir(configPath)): return os.listdir(configPath)

    if(request.method == "GET"):
        return send_from_directory(*os.path.split(configPath))

    if(request.method == "POST"):
        with open(configPath, "a+") as f:
            f.seek(0)
            config = json.load(f)
            try:
                data = request.get_json(force=True)
                config.update(data)
                f.truncate(0)
                json.dump(config, f, indent=4, ensure_ascii=False)
            except:
                return Response(status=422)
        return Response(status=202)


App.control_functions = {}
@App.route("/controls/<string:name>", methods=["POST"])
def App_Controls(**kwargs):
    name = kwargs["name"]
    if(name not in App.control_functions): return Response(status=404)
    try: data = request.get_json(force=True)
    except: data = []
    App.control_functions[name](*data)
    return Response(status=200)
