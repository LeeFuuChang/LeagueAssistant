from flask import Blueprint, request
import requests as rq
import json
import bs4
import os

Opgg = Blueprint("Opgg", __name__)
@Opgg.route("/api/<path:subUrl>")
def OpggApi(**kwargs):
    """
    https://op.gg/api/v1.0/internal/bypass/champions/global/ranked
    """
    response = rq.get(
        f"https://op.gg/api/v1.0/internal/bypass/{kwargs['subUrl']}",
        params=request.args.to_dict(),
        headers={"User-Agent": os.environ["USER_AGENT"]}
    )
    try: return response.json()
    except: return {}

@Opgg.route("/lol/<path:subUrl>")
def OpggLol(**kwargs):
    response = rq.get(
        f"https://www.op.gg/{kwargs['subUrl']}",
        params=request.args.to_dict(),
        headers={"User-Agent": os.environ["USER_AGENT"]}
    )
    soup = bs4.BeautifulSoup(response.text, "html.parser")
    data = soup.find("script", {"id": "__NEXT_DATA__", "type": "application/json"})
    data = json.loads(data.decode_contents()).get("props", {}).get("pageProps", {})
    return data

@Opgg.route("/tft/<path:subUrl>")
def OpggTft(**kwargs):
    response = rq.get(
        f"https://tft.op.gg/{kwargs['subUrl']}",
        params=request.args.to_dict(),
        headers={"User-Agent": os.environ["USER_AGENT"]}
    )
    soup = bs4.BeautifulSoup(response.text, "html.parser")
    data = soup.find("script", {"id": "__NEXT_DATA__", "type": "application/json"})
    data = json.loads(data.decode_contents()).get("props", {})
    pageProp = data.get("pageProps", {})
    fallback = data.get("fallback", {})
    pageProp["fallback"] = {key.split("\",\"")[1]:val for key, val in fallback.items() if("\",\"" in key)}
    return pageProp

@Opgg.route("/tft-api/<path:subUrl>")
def OpggTftApi(**kwargs):
    response = rq.get(
        f"https://tft-api.op.gg/{kwargs['subUrl']}",
        params=request.args.to_dict(),
        headers={"User-Agent": os.environ["USER_AGENT"]}
    )
    try: return response.json()
    except: return {}
