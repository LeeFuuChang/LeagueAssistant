const RANK_TIERS = [
    "CHALLENGER",
    "GRANDMASTER",
    "MASTER",
    "DIAMOND",
    "EMERALD",
    "PLATINUM",
    "GOLD",
    "SILVER",
    "BRONZE",
    "IRON",
];

const TRANSLATION_PAIRS = {
    "CHALLENGER": "菁英",
    "GRANDMASTER": "宗師",
    "MASTER": "大師",
    "DIAMOND": "鑽石",
    "EMERALD": "翡翠",
    "PLATINUM": "白金",
    "GOLD": "金牌",
    "SILVER": "銀牌",
    "BRONZE": "銅牌",
    "IRON": "鐵牌",
    "NONE": "待定",
    "UNRANKED": "待定",

    "NA": "-",
};

const KEYCODE2KEY = {
    8: "Backspace",
    9: "Tab",
    12: "NumLock",
    13: "Enter",
    16: "Shift",
    17: "Ctrl",
    18: "Alt",
    20: "CapsLock",
    27: "ESC",
    32: "Space",
    33: "PageU",
    34: "PageD",
    35: "End",
    36: "Home",
    37: "ArrowL",
    38: "ArrowU",
    39: "ArrowR",
    40: "ArrowD",
    45: "Insert",
    46: "Delete",
    48: "Digit0",
    49: "Digit1",
    50: "Digit2",
    51: "Digit3",
    52: "Digit4",
    53: "Digit5",
    54: "Digit6",
    55: "Digit7",
    56: "Digit8",
    57: "Digit9",
    58: ":",
    59: ";",
    60: "<",
    61: "=",
    63: "ß",
    65: "A",
    66: "B",
    67: "C",
    68: "D",
    69: "E",
    70: "F",
    71: "G",
    72: "H",
    73: "I",
    74: "J",
    75: "K",
    76: "L",
    77: "M",
    78: "N",
    79: "O",
    80: "P",
    81: "Q",
    82: "R",
    83: "S",
    84: "T",
    85: "U",
    86: "V",
    87: "W",
    88: "X",
    89: "Y",
    90: "Z",
    91: "MetaL",
    92: "MetaR",
    96: "Numpad0",
    97: "Numpad1",
    98: "Numpad2",
    99: "Numpad3",
    100: "Numpad4",
    101: "Numpad5",
    102: "Numpad6",
    103: "Numpad7",
    104: "Numpad8",
    105: "Numpad9",
    106: "Numpad*",
    107: "Numpad+",
    108: "Numpad,",
    109: "Numpad-",
    110: "Numpad.",
    111: "Numpad/",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    160: "^",
    163: "#",
    164: "$",
    169: ")",
    170: "*",
    171: "+",
    172: "|",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    193: "/",
    194: ".",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
    223: "`",
    226: "\\",
}

window.Translate = (key, __replace=undefined)=>{
    return (TRANSLATION_PAIRS[key]===undefined) ? __replace : TRANSLATION_PAIRS[key];
};

class SummonerIdentifier {
    static prevIdentifiers = [];
    static nextIdentifiers = [];
    static currentIdentifier = undefined;

    static ResolveWrapper = (resolve, identifier)=>{
        if(this.currentIdentifier) this.prevIdentifiers.push(this.currentIdentifier);
        this.currentIdentifier = identifier;
        resolve(this.currentIdentifier);
        this.CheckPrevAvailable();
        this.CheckNextAvailable();
    }

    static CheckPrevAvailable = ()=>{
        if(this.prevIdentifiers.length === 0){
            $("#page-controls-previous").prop("disabled", 1).addClass("disabled");
        }else{
            $("#page-controls-previous").prop("disabled", 0).removeClass("disabled");
        }
    }

    static PrevIdentifier = ()=>{
        if(this.currentIdentifier) this.nextIdentifiers.push(this.currentIdentifier);
        this.currentIdentifier = this.prevIdentifiers.pop();
        this.CheckPrevAvailable();
        this.CheckNextAvailable();
        return this.currentIdentifier;
    }

    static CheckNextAvailable = ()=>{
        if(this.nextIdentifiers.length === 0){
            $("#page-controls-next").prop("disabled", 1).addClass("disabled");
        }else{
            $("#page-controls-next").prop("disabled", 0).removeClass("disabled");
        }
    }

    static NextIdentifier = ()=>{
        if(this.currentIdentifier) this.prevIdentifiers.push(this.currentIdentifier);
        this.currentIdentifier = this.nextIdentifiers.pop();
        this.CheckPrevAvailable();
        this.CheckNextAvailable();
        return this.currentIdentifier;
    }

    static CreateTemplate = ()=>{
        return {
            "accountId": 0,
            "displayName": "查無此召喚師",
            "gameName": "查無此召喚師",
            "internalName": "查無此召喚師",
            "tagLine": "",
            "nameChangeFlag": false,
            "percentCompleteForNextLevel": 0,
            "privacy": "",
            "profileIconId": 0,
            "puuid": "",
            "rerollPoints": {
                "currentPoints": 0,
                "maxRolls": 0,
                "numberOfRolls": 0,
                "pointsCostToRoll": 0,
                "pointsToReroll": 0
            },
            "summonerId": 0,
            "summonerLevel": 0,
            "unnamed": false,
            "xpSinceLastLevel": 0,
            "xpUntilNextLevel": 0,
            "invalid": true
        }
    }

    static CurrentSummoner = (callback)=>{
        let promise = new Promise((resolve, reject)=>{
            let requestURL = "/riot/lcu/0/lol-summoner/v1/current-summoner";
            $.get(requestURL, {}, (data)=>{
                let identifier = (data["success"]?data["response"]:this.CreateTemplate());
                this.ResolveWrapper(resolve, identifier)
            });
        });
        return promise;
    }

    static FromPuuid = (puuid)=>{

    }

    static FromSummonerId = (summonerId)=>{
        let promise = new Promise((resolve, reject)=>{
            let requestURL = `/riot/lcu/0/lol-summoner/v1/summoners/${summonerId}`;
            $.get(requestURL, {}, (data)=>{
                let identifier = (data["success"]?data["response"]:this.CreateTemplate());
                this.ResolveWrapper(resolve, identifier)
            });
        });
        return promise;
    }

    static FromAccountId = (accountId)=>{
        let promise = new Promise((resolve, reject)=>{
            let requestURL = `/riot/lcu/0/lol-summoner/v1/summoners/${accountId}`;
            $.get(requestURL, {}, (data)=>{
                let identifier = (data["success"]?data["response"]:this.CreateTemplate());
                this.ResolveWrapper(resolve, identifier)
            });
        });
        return promise;
    }

    static FromDisplayName = (displayName)=>{
        let promise = new Promise((resolve, reject)=>{
            let requestURL = "/riot/lcu/0/lol-summoner/v1/summoners";
            $.get(requestURL, {"name": displayName}, (data)=>{
                let identifier = (data["success"]?data["response"]:this.CreateTemplate());
                this.ResolveWrapper(resolve, identifier)
            });
        });
        return promise;
    }
}


window.ToCDragonPath = (path)=>{
    let communityDragonAssetsURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/";
    return communityDragonAssetsURL + (path||"").replace("/lol-game-data/assets/", "").toLowerCase();
}

window.LoadedClasses = [];
window.LoadClasses = (path)=>{
    let loadSingle = (classPath)=>{
        return new Promise((resolve, reject)=>{
            if(!window.LoadedClasses.includes(classPath)){
                window.LoadedClasses.push(classPath);
                $.getScript(classPath).done(function(script, textStatus){
                    resolve(console.log(`resolve: ${textStatus}\n${classPath}`));
                });
            }else resolve();
        });
    }
    return Promise.all([
        loadSingle("assets/body/side/class.js"),
        loadSingle("assets/body/main/class.js"),
    ]).then(()=>{
        return new Promise((resolve, reject)=>{
            $.get(path, {}, (classes)=>{
                resolve(classes);
            });
        });
    }).then((classes)=>{
        let loadByIndex = (idx)=>{
            if(idx >= classes.length) return Promise.resolve();
            return loadSingle(classes[idx]).then(()=>loadByIndex(idx+1));
        }
        return loadByIndex(0);
    });
};

window.LoadImage = (src)=>{
    let $img = $("<img>").attr("src", src).hide(0);
    $img.appendTo("#image-preloads");
    return new Promise((res, rej)=>{$img.one("load", ()=>{res(src)})});
};

window.MakeData = ({functions={}, identifier={}, summoner={}, options={}}={})=>{
    return {"functions": functions, "identifier": identifier, "summoner": summoner, "options": options};
};

window.resizeDisplay = ({
    mode = $("#app").attr("size"), 
    base = parseInt($(":root").css("--base").slice(0, -2))||720, 
    zoom = parseFloat($(":root").css("--zoom"))||1,
}={})=>{
    let mult = {"expanded": 2.0, "contract": 0.5};
    let time = parseFloat($("#app").css("transition-duration").slice(0, -1).split(", ").pop())*1750;
    let modeChanged = ($("#app").attr("size") !== mode);
    let baseChanged = ($(":root").css("--base") !== `${base}px`);
    let zoomChanged = ($(":root").css("--zoom") !== `${zoom}`);
    if(!(modeChanged || baseChanged || zoomChanged)) return Promise.resolve();
    return Promise.all([
        $("#app").attr("size", mode),
        $(":root").css("--base", `${base}px`),
        $(":root").css("--zoom", zoom),
    ]).then(()=>Promise.resolve(setTimeout(()=>$.post(
        "/app/controls/app-control-resize", 
        JSON.stringify([base*zoom*mult[mode], base*zoom])
    ), time)));
}

window.switchTheme = (theme)=>{
    if(!theme) theme = ({"dark":"light","light":"dark"}[$("#app").attr("theme")]);
    let currentTheme = $("#app").attr("theme");
    if(currentTheme === theme) return;
    $("#app").attr("theme", theme);
    [window.Side, window.Main, window.Overlay].forEach((part)=>{
        if(part===undefined || typeof part.components!=="object") return;
        Object.values(part.components).forEach(c=>{if(c.ReloadContent)c.ReloadContent()});
    });
};


window.LoadHomePage = (()=>Promise.all([
    window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
    window.LoadClasses("assets/body/main/pages/summoner-season-overview/classes.json"),
]).then(()=>SummonerIdentifier.CurrentSummoner().then((identifier)=>{
    window.LoadPage(Side_Summoner, Main_SummonerSeasonOverview, window.MakeData({summoner:identifier}));
})));


window.showAd = (()=>{
    $.get("/app/ad", {}, (data)=>{
        let cover = $("#app-cover").removeClass("loading__Ad");
        if(!(data["href"]&&data["banner"])) return;
        let duration = 5;
        let count = (()=>{
            if(--duration<=0) cover.find("#ad .close").text("close").on("click", ()=>cover.removeClass("loading__Ad"));
            else Promise.resolve(cover.find("#ad .close").text(duration)).then(()=>setTimeout(count, 1000));
        });
        let visit = (()=>$.post("/app/external",{"url":data["href"]}));
        cover.addClass("loading__Ad");
        cover.find("#ad .link").attr("src", data["banner"]).off("click").on("click", visit);
        cover.find("#ad .close").text(duration).off("click");
        setTimeout(count, 1000);
    });
});


Math.abbreviate = (n)=>{
    let alphabets = ["", "K", "M", "B", "T"];
    let charIndex = 0;
    for(charIndex=0; n>=1000; charIndex++) n /= 1000;
    return [n, alphabets[charIndex]];
};


$(document).ready(function(){
    $("body").on("contextmenu", e=>false);

    $(".no-transition-load").ready(function(){$(this).removeClass("no-transition-load")});

    $.get("/app/config/app.json", {}, (data)=>$("#app").attr("theme", data["dark-theme"]?"dark":"light"));

    // window.showAd();
    window.resizeDisplay();
});