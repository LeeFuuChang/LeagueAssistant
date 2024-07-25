from flask import Blueprint, request
import requests as rq
import json
import os

Qq = Blueprint("Qq", __name__)
@Qq.route("/native/<path:subUrl>", methods=["GET"])
def QqNative(**kwargs):
    response = rq.get(
        f"https://faas-6831.native.qq.com/faas/6831/1371/{kwargs['subUrl']}",
        params=request.args.to_dict(),
        headers={"User-Agent": os.environ["USER_AGENT"]}
    )
    try: return response.json()
    except: return {}

@Qq.route("/common/<path:subUrl>", methods=["GET"])
def QqCommon(**kwargs):
    """
    /guideschampion_position.js?ts=${Date.now() / 600000 >> 0}
    /guideschampion_rank.js?ts=${Date.now() / 600000 >> 0}
    /champDetail/champDetail_${heroId}.js?ts=${Date.now() / 600000 >> 0}
    /champDetail_trend.js?ts=${Date.now() / 600000 >> 0}
    /gicpTagChan.js?ts=${Date.now() / 600000 >> 0}
    """
    response = rq.get(
        f"https://lol.qq.com/act/lbp/common/guides/{kwargs['subUrl']}",
        params=request.args.to_dict(),
        headers={"User-Agent": os.environ["USER_AGENT"]}
    )
    try: return json.loads(response.text[response.text.find("{"):response.text.rfind("}")+1])
    except: return {}

@Qq.route("/gtimg/<path:subUrl>", methods=["GET"])
def QqGtimg(**kwargs):
    """
    /js/heroList/hero_list.js?ts=${Date.now() / 600000 >> 0}
    /champion/${item.alias}.png
    /skinloading/${item.instance_id}.jpg
    /guidetop/guide${item.heroId}000.jpg
    /js/items/items.js?ts=${Date.now() / 600000 >> 0}
    /js/hero/${heroId}.js?ts=${Date.now() / 600000 >> 0}
    /js/runeList/rune_list.js
    /js/items_ext/items_ext.js
    /js/summonerskillList/summonerskill_list.js
    """
    response = rq.get(
        f"https://game.gtimg.cn/images/lol/act/img/{kwargs['subUrl']}",
        params=request.args.to_dict(),
        headers={"User-Agent": os.environ["USER_AGENT"]}
    )
    try: return response.json()
    except: return {}