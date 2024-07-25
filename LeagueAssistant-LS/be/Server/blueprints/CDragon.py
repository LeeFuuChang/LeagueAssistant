from flask import Blueprint, jsonify
import requests as rq

CDragon = Blueprint("Cdragon", __name__)

@CDragon.route("/<string:subdomain>/<path:subpath>", methods=["GET"])
def Cdragon_Content(**kwargs):
    subdomain = kwargs["subdomain"]
    subpath = kwargs["subpath"]
    cdragonURL = f"https://{subdomain}.communitydragon.org/latest/{subpath}"
    response = rq.get(cdragonURL)
    content_type = response.headers.get("Content-Type")
    if content_type.startswith("application/json"): return jsonify(response.json())
    return response.content
