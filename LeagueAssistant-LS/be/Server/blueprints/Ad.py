from flask import Blueprint, Response, request
import webbrowser
import requests
import random
import os

Ad = Blueprint("Ad", __name__)

@Ad.route("/random", methods=["GET"])
def Ad_Random():
    try: data = requests.get(f"{os.environ['SERVER_URL']}/Ads").json()
    except: data = []
    return {} if(not data)else random.choice(data)

@Ad.route("/visit", methods=["POST"])
def Ad_Visit():
    if("href" not in request.form): return Response(status=400)
    webbrowser.open(request.form["href"])
    return Response(status=200)
