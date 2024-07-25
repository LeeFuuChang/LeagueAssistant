from flask import Blueprint, request
import json
import bs4

from .. import scraper

Opgg = Blueprint("Opgg", __name__)
@Opgg.route("/api/<path:subUrl>")
def OpggApi(**kwargs):
    """
    https://op.gg/api/v1.0/internal/bypass/champions/global/ranked
    """
    subUrl = kwargs["subUrl"]
    return scraper.get(f"https://op.gg/api/v1.0/internal/bypass/{subUrl}", params=request.args.to_dict()).json()

@Opgg.route("/lol/<path:subUrl>")
def OpggLol(**kwargs):
    subUrl = kwargs["subUrl"]
    soup = bs4.BeautifulSoup(scraper.get(f"https://www.op.gg/{subUrl}", params=request.args.to_dict()).text, "html.parser")
    data = soup.find("script", {"id": "__NEXT_DATA__", "type": "application/json"})
    data = json.loads(data.decode_contents()).get("props", {}).get("pageProps", {})
    return data

@Opgg.route("/tft/<path:subUrl>")
def OpggTft(**kwargs):
    subUrl = kwargs["subUrl"]
    soup = bs4.BeautifulSoup(scraper.get(f"https://tft.op.gg/{subUrl}", params=request.args.to_dict()).text, "html.parser")
    data = soup.find("script", {"id": "__NEXT_DATA__", "type": "application/json"})
    data = json.loads(data.decode_contents()).get("props", {})
    pageProp = data.get("pageProps", {})
    fallback = data.get("fallback", {})
    pageProp["fallback"] = {key.split("\",\"")[1]:val for key, val in fallback.items() if("\",\"" in key)}
    return pageProp

@Opgg.route("/tft-api/<path:subUrl>")
def OpggTftApi(**kwargs):
    subUrl = kwargs["subUrl"]
    return scraper.get(f"https://tft-api.op.gg/{subUrl}", params=request.args.to_dict()).json()