from flask import Blueprint, jsonify
import requests as rq

DDragon = Blueprint("DDragon", __name__)

@DDragon.route("/<path:subpath>", methods=["GET"])
def DDragon_Content(**kwargs):
    ddragonVersions = rq.get("https://ddragon.leagueoflegends.com/api/versions.json").json()
    response = rq.get(f"https://ddragon.leagueoflegends.com/cdn/{ddragonVersions[0]}/{kwargs['subpath']}")
    content_type = response.headers.get("Content-Type")
    if content_type.startswith("application/json"): return jsonify(response.json())
    return response.content
