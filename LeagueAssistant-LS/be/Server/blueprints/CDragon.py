from flask import Blueprint, jsonify
import requests as rq

CDragon = Blueprint("CDragon", __name__)

@CDragon.route("/<string:subdomain>/<path:subpath>", methods=["GET"])
def Cdragon_Content(**kwargs):
    response = rq.get(f"https://{kwargs['subdomain']}.communitydragon.org/latest/{kwargs['subpath']}")
    content_type = response.headers.get("Content-Type")
    if content_type.startswith("application/json"): return jsonify(response.json())
    return response.content
