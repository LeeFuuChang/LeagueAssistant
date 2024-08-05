from flask import Blueprint, Response, send_file, request
import requests as rq
import json
import bs4
import re
import os

from .LeagueClientAPI import LeagueClientAPI
from .LiveClientAPI import LiveClientAPI


Riot = Blueprint("Riot", __name__)


@Riot.route("/local/<path:filepath>", methods=["GET"])
def Riot_Local(**kwargs):
    fullpath = os.path.join(os.environ["LOL_INSTALL_DIRECTORY"], kwargs["filepath"])
    if(not os.path.exists(fullpath)): return Response(status=404)
    if(os.path.isdir(fullpath)): return os.listdir(fullpath)
    return send_file(fullpath)


@Riot.route("/mmr/<string:summonerId>", methods=["GET"])
def Riot_Mmr(**kwargs):
    summonerId = kwargs["summonerId"]
    soup = bs4.BeautifulSoup(rq.get(
        f"https://lol.moa.tw/Ajax/interestscore/{summonerId}", 
    ).text, "html.parser")
    text = getattr(soup.select_one(".label.label-danger"), "text", "")
    regex = re.search(r"\d+", text)
    return {
        "success": bool(regex),
        "reason": f"TEXT PARSED: {text}",
        "response": int(regex.group(0)) if(regex)else 0,
    }


@Riot.route("/lcu", methods=["GET"])
def Riot_Lcu_Status():
    return json.dumps(LeagueClientAPI.isRiotAuthValid(maxRetries=1))

@Riot.route("/lcu/<int:authId>/<path:route>", methods=["GET", "POST", "DELETE", "PATCH"])
def Riot_Lcu(**kwargs):
    authId = kwargs["authId"]
    route = kwargs["route"]
    if(request.method == "GET"):
        args = request.args.to_dict()
        return LeagueClientAPI.get(authId, route, args)
    elif(request.method == "POST"):
        try: data = request.get_json(force=True)
        except: data = None
        if(not data): data = None
        return LeagueClientAPI.post(authId, route, data)
    elif(request.method == "DELETE"):
        try: data = request.get_json(force=True)
        except: data = None
        if(not data): data = None
        return LeagueClientAPI.delete(authId, route, data)
    elif(request.method == "PATCH"):
        try: data = request.get_json(force=True)
        except: data = None
        if(not data): data = None
        return LeagueClientAPI.patch(authId, route, data)


@Riot.route("/ingame/<path:route>")
def Riot_Ingame(**kwargs):
    route = kwargs["route"]
    args = request.args.to_dict()
    return LiveClientAPI.get(route, args)