from flask import Blueprint, jsonify
import requests as rq

Ddragon = Blueprint("Ddragon", __name__)

@Ddragon.route("/<path:subpath>", methods=["GET"])
def Ddragon_Content(**kwargs):
    subpath = kwargs["subpath"]
    ddragonVersionURL = "https://ddragon.leagueoflegends.com/api/versions.json"
    ddragonVersionRes = rq.get(ddragonVersionURL).json()
    ddragonLatest = ddragonVersionRes[0]
    ddragonURL = f"https://ddragon.leagueoflegends.com/cdn/{ddragonLatest}/{subpath}"
    response = rq.get(ddragonURL)
    content_type = response.headers.get("Content-Type")
    if content_type.startswith("application/json"): return jsonify(response.json())
    return response.content