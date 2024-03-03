class Main_Part_ConfigSettingsSpell extends Main_Part_Config_Abstract {
    static elementURL = "/ui/assets/body/main/parts/config-settings-spell/element.html";

    static defaultCustomPairs = {
        "settings/spell/overall/options/lane-nickname": {
            "inputs": ".config-group[data-name='overall'] .config-item[data-name='nickname'] .option input",
            "values": ["TOP", "JG", "MID", "AD", "SUP"],
            "isReadOnly": true
        },
        "settings/spell/overall/options/number-nickname": {
            "inputs": ".config-group[data-name='overall'] .config-item[data-name='nickname'] .option input",
            "values": ["P1", "P2", "P3", "P4", "P5"],
            "isReadOnly": true
        },
        "settings/spell/overall/options/custom-nickname": {
            "inputs": ".config-group[data-name='overall'] .config-item[data-name='nickname'] .option input",
            "values": ["", "", "", "", ""],
            "isReadOnly": false
        },
    };

    ReloadContent = ()=>{
        let summonerSpellsDefaultPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-spells.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.filter((s)=>(s["gameModes"].includes("CLASSIC"))).map((s)=>[parseInt(s["id"]), s]))));
        });
        let summonerSpellsTwPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/summoner-spells.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.filter((s)=>(s["gameModes"].includes("CLASSIC"))).map((s)=>[parseInt(s["id"]), s]))));
        });
        let championNamesPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/champion-summary.json";
            $.get(requestURL, {}, (data)=>resolve(data.filter((c)=>(parseInt(c["id"])>0)).map((c)=>c["name"])));
        });
        let spellConfigPromise = new Promise((resolve, reject)=>{
            resolve(Object.fromEntries($(this.element).find(".config-group").get().map((group)=>[
                $(group).attr("data-name"), Object.fromEntries($(group).find(".config-item").get().map((item)=>[
                    $(item).attr("data-name"), Object.fromEntries($(item).find(".option").get().map((option)=>[
                        $(option).attr("data-name"), this.data["functions"]["GetInputValue"]($(option).find("input"))
                    ]))
                ]))
            ])));
        });
        return Promise.all([
            summonerSpellsDefaultPromise,
            summonerSpellsTwPromise,
        ]).then(([
            summonerSpellsDefault,
            summonerSpellsTw,
        ])=>Promise.all([
            spellConfigPromise,
            championNamesPromise,
            Promise.resolve(Object.fromEntries(
                Object.keys(summonerSpellsDefault).filter((i)=>(i in summonerSpellsTw)).map((i)=>[i, {
                    "cd": summonerSpellsDefault[i]["cooldown"],
                    "en": summonerSpellsDefault[i]["name"],
                    "tw": summonerSpellsTw[i]["name"],
                }])
            )),
        ])).then(([
            spellConfig,
            championNames,
            summonerSpells,
        ])=>{
            let previewers = $(this.element).find(".config-group[data-name='preview'] .config-item").get();
            let seperator = " | ";
            let chancesInCooldown = 0.7;
            let spellHotkeys = ["D", "F"];
            let randomChampionNames = championNames.sort(()=>(0.5-Math.random())).slice(0, previewers.length);
            let randomCurrentGameTime = parseInt(25*60*Math.random());
            previewers.forEach((previewItem, previewIdx)=>{
                let previewKey = $(previewItem).attr("data-name");

                let getConfig = (keyA, keyB, keyC, alt)=>(((spellConfig[keyA]||{})[keyB]||{})[keyC]||alt);

                let playerNick = randomChampionNames[previewIdx];
                let sendOptionsChampionName = getConfig("send", "options", "champion-name", 0);
                if(!sendOptionsChampionName) playerNick = getConfig("overall", "nickname", previewKey, previewKey);

                let randomSpellIds = Object.keys(summonerSpells).sort(()=>(0.5-Math.random())).slice(0, spellHotkeys.length);

                let sendOnlyFlash = getConfig("send", "options", "only-flash", 0);
                let sendOnlyInCooldown = getConfig("send", "options", "only-incooldown", 0);
                let sendFormatCooldownG = getConfig("send", "format", "game-time", 0);
                let sendFormatCooldownM = getConfig("send", "format", "cooldown-m", 0);
                let sendFormatCooldownS = getConfig("send", "format", "cooldown-s", 0);

                let spellString = spellHotkeys.map((hotkey, idx)=>({
                    "key": hotkey,
                    "tw": summonerSpells[randomSpellIds[idx]]["tw"],
                    "en": summonerSpells[randomSpellIds[idx]]["en"],
                    "cd": summonerSpells[randomSpellIds[idx]]["cd"]*Math.random()*(chancesInCooldown>Math.random()),
                })).map((data)=>{
                    if(sendOnlyFlash && !data["en"].toLowerCase().includes("flash")) return "";
                    if(sendOnlyInCooldown && !(data["cd"] > 0)) return "";
                    let spellNick = data[Object.keys(data).filter((k)=>getConfig("send", "nickname", k, 0))[0]||"key"];
                    let timeString = "ready";
                    if(!(data["cd"] > 0)){
                        timeString = "ready";
                    }else if(sendFormatCooldownG){
                        let upGameTime = (randomCurrentGameTime + data["cd"]);
                        let upGameTimeM = String(parseInt(upGameTime/60)).padStart(2, "0");
                        let upGameTimeS = String(parseInt(upGameTime%60)).padStart(2, "0");
                        timeString = `${upGameTimeM}${upGameTimeS}`;
                    }else if(sendFormatCooldownM){
                        timeString = `${parseInt(data["cd"]/60)}m${parseInt(data["cd"]%60)}s`;
                    }else if(sendFormatCooldownS){
                        timeString = `${parseInt(data["cd"])}s`;
                    }
                    return `${spellNick} ${timeString}`;
                }).filter(s=>s).join(seperator);

                $(previewItem).find("input.text-preview").val(`" ${[
                    playerNick, spellString
                ].join(seperator).repeat(spellString.length>0)} "`);
            });
        });
    }
}