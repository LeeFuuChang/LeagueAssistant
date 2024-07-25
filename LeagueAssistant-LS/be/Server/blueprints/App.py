from flask import Blueprint, send_from_directory, request, Response
import requests as rq
import webbrowser
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

@App.route("/external", methods=["POST"])
def App_External():
    if("url" not in request.form): return Response(status=404)
    webbrowser.open(str(request.form["url"]))
    return Response(status=202)

@App.route("/config/<string:name>", methods=["GET", "POST"])
def App_Config(**kwargs):
    LocalStorage = getattr(sys.modules["StorageManager"], "LocalStorage")
    configPath = LocalStorage.path(os.path.join("cfg", "app", f"{kwargs['name']}.json"))
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

App.control_functions = {}
@App.route("/controls/<string:name>", methods=["POST"])
def App_Controls(**kwargs):
    name = kwargs["name"]
    if(name not in App.control_functions): return Response(status=404)
    try: data = request.get_json(force=True)
    except: data = []
    App.control_functions[name](*data)
    return Response(status=200)
