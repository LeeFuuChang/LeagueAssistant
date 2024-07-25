class Main_Part_Config_Abstract extends AppBodyMain_Part {
    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement(container)
        .then(()=>this.SetupConfigOptions())
        .then(()=>this.SetupConfigValues())
        .then(()=>this.ReloadContent());
    }

    SetupConfigOptions = ()=>{
        window.Widgets.Setup_Stepper($(this.element).find(".config-item .item-options .option .stepper"));

        $(this.element).find(".config-item").on("mouseover", this.data["functions"]["LoadItemDescription"]);

        $(this.element).find(".config-item .item-options .option .champion").on("click", this.data["functions"]["LoadSelectChampion"]);

        $(this.element).find(".config-item .item-options .option .spell").on("click", this.data["functions"]["LoadSelectSpell"]);

        $(this.element).find(".config-item .item-options .runepage").on("click", this.data["functions"]["LoadSelectRunePage"]);

        $(this.element).find(".config-item .item-options .option .keybind").on({
            "keydown":this.data["functions"]["CatchKeyPress"],
            "mousedown":function(e){if(e.button===2){$(this).attr("data-key", "-1").val("").trigger("change", [true,])}},
        });

        $(this.element).find(".config-item .item-options .option input").on("change", this.data["functions"]["OnConfigChange"]);

        return Promise.resolve();
    }

    SetupConfigValues = ()=>{
        let championNamesPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/champion-summary.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((c)=>[parseInt(c["id"]), c["name"]]))));
        });
        let summonerSpellNamesPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/summoner-spells.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.filter((s)=>(s["gameModes"].includes("CLASSIC"))).map((s)=>[parseInt(s["id"]), s["name"]]))));
        });
        let perkIconsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json"
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))));
        }).then((icons)=>new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perkstyles.json"
            $.get(requestURL, {}, (data)=>resolve({...icons,...Object.fromEntries(data["styles"].map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))}));
        }));
        return Promise.all([
            championNamesPromise,
            summonerSpellNamesPromise,
            perkIconsPromise,
        ]).then(([
            championNames,
            summonerSpellNames,
            perkIcons,
        ])=>{
            let GetConfigPath = this.data["functions"]["GetConfigPath"];
            let CheckDefaultCustom = this.data["functions"]["CheckDefaultCustom"];
            let itemGroups = $(this.element).find(".config-item .item-options").get();
            return Promise.all(itemGroups.reverse().map((item)=>new Promise((resolve, reject)=>{
                if($(item).is("[readonly]")) return resolve();
                $.get(`/config/${GetConfigPath($(item))}`, {}, (data)=>{
                    Promise.all(Object.keys(data).map((dataName)=>new Promise((res, rej)=>{
                        let option = $(item).find(`.option[data-name="${dataName}"]`);
                        let input = option.find("input");
                        if(input.is(".switch")){
                            input.prop("checked", data[dataName]);
                        }else if($(input).is(".checkbox")){
                            input.prop("checked", data[dataName]);
                        }else if(input.is(".slider")){
                            input.val(parseInt(data[dataName]));
                        }else if(input.is(".keybind")){
                            input.attr("data-key", data[dataName]).val(KEYCODE2KEY[data[dataName]]);
                        }else if(input.is(".champion")){
                            let championId = data[dataName];
                            if(championNames[championId] === undefined) championId = -1;
                            input.attr("data-id", championId);
                            input.val(championNames[championId]);
                        }else if(input.is(".spell")){
                            let spellId = data[dataName];
                            if(summonerSpellNames[spellId] === undefined) spellId = -1;
                            input.attr("data-id", spellId);
                            input.val(spellId>0?summonerSpellNames[spellId]:"無");
                        }else if(input.is(".rune")){
                            let perkId = data[dataName];
                            input.val(perkId).closest(".option").find("img").attr("src",
                                perkIcons[perkId]?perkIcons[perkId]:"data:image/svg+xml;utf8,<svg></svg>"
                            );
                        }else if(input.is(".text-preview")){
                            input.val("");
                        }else{
                            input.val(data[dataName]);
                        }
                        input.trigger("change", [false,]);
                        res(option.is("[data-pair-name]")?CheckDefaultCustom(input):0);
                    }))).then(()=>resolve());
                });
            })));
        });
    }

    ReloadContent = ()=>{}
}

class Main_Config extends AppBodyMain {
    static pageType = "config";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": this.data["identifier"]["name"],
            "class": this.data["identifier"]["class"],
            "data": window.MakeData({
                functions: {
                    "GetConfigPath": this.GetConfigPath,
                    "GetInputValue": this.GetInputValue,
                    "LoadDescription": this.LoadDescription,
                    "LoadItemDescription": this.LoadItemDescription,
                    "LoadSelectChampion": this.LoadSelectChampion,
                    "LoadSelectSpell": this.LoadSelectSpell,
                    "LoadSelectRunePage": this.LoadSelectRunePage,
                    "CatchKeyPress": this.CatchKeyPress,
                    "CheckDefaultCustom": this.CheckDefaultCustom,
                    "OnConfigChange": this.OnConfigChange,
                }
            }),
        }, {
            "name": "config-description",
            "class": Main_Part_ConfigDescription,
            "data": window.MakeData(),
        }])
    }

    GetInputValue = (input)=>{
        let value;
        if($(input).is(".switch")){
            value = $(input).is(":checked");
        }else if($(input).is(".checkbox")){
            value = $(input).is(":checked");
        }else if($(input).is(".slider")){
            value = parseInt(input.val());
        }else if($(input).is(".keybind")){
            value = parseInt($(input).attr("data-key"));
        }else if($(input).is(".champion")){
            value = parseInt($(input).attr("data-id"))||-1;
        }else if($(input).is(".spell")){
            value = parseInt($(input).attr("data-id"))||-1;
        }else if($(input).is(".rune")){
            value = parseInt($(input).val())||-1;
        }else{
            value = $(input).val();
        }
        return value;
    }

    CheckInputValid = (input)=>{
        let option = $(input).closest(".option");
        let dataGroup = option.attr("data-group");
        if(!dataGroup) $(option).removeClass("invalid");
        let value = this.GetInputValue(input);
        let other = $(option).closest(".config-group").find(`.option[data-group="${dataGroup}"] input`).not($(input));
        let isValid = (!other.get().some((inp)=>{
            let val = this.GetInputValue(inp);
            return !value || !val || (val!==-1&&val===value);
        }));
        $(option).toggleClass("invalid", !isValid);
        return isValid;
    }

    CheckDefaultCustom = (input)=>{
        let path = this.GetConfigPath(input);
        let name = $(input).closest(".option").attr("data-pair-name");
        if(!this.GetInputValue(input)) return Promise.resolve();
        let defaultCustomKey = `${path}/${name}`;
        return Promise.all(Object.values(this.components).map((component)=>{
            let pairData = Object.getPrototypeOf(component).constructor.defaultCustomPairs;
            if(!pairData) return Promise.resolve();
            let pair = pairData[defaultCustomKey];
            if(!pair) return Promise.resolve();
            let updateInputs = (i)=>{
                if(i >= pair["values"].length) return Promise.resolve();
                return new Promise((resolve, reject)=>{
                    let inp = $(pair["inputs"]).eq(i);
                    if(pair["values"][i]) inp.val(pair["values"][i]);
                    inp.prop("readonly", pair["isReadOnly"]);
                    return resolve();
                }).then(()=>updateInputs(i+1));
            };
            return updateInputs(0).then(()=>Promise.resolve($(pair["inputs"]).first().change()));
        }));
    }

    GetConfigPath = (ele)=>{
        return [
            ["section", "data-type"],
            ["section", "data-name"],
            [".config-group", "data-name"],
            [".config-item", "data-name"],
        ].map(([selector, attrname])=>{
            return $(ele)
            .closest(selector)
            .attr(attrname);
        }).join("/");
    }

    RemoveSelectionComponents = ()=>{
        return Promise.all([
            this.RemoveComponent("lol-champion-list"),
            this.RemoveComponent("summoner-spell-list"),
            this.RemoveComponent("select-rune-page"),
        ]);
    }

    LoadDescription = ()=>{
        return this.RemoveSelectionComponents().then(()=>{
            return this.AddComponent("config-description", Main_Part_ConfigDescription, window.MakeData(), 1);
        });
    }
    LoadItemDescription = (event)=>{
        if(this.components["config-description"] !== undefined){
            $(this.components["config-description"].element)
            .find(".config-description>.block-inner")
            .html($(event.currentTarget).find(".item-description").html());
        }
    }

    LoadSelectChampion = (event)=>{
        return Promise.all([
            this.RemoveComponent("config-description"),
            this.RemoveSelectionComponents(),
        ]).then(()=>{
            if(this.components["lol-champion-list"] !== undefined) return;
            return this.AddComponent("lol-champion-list", Main_Part_LolChampionList, window.MakeData({
                identifier:{"triggerElement":event.currentTarget},
                functions:{"OnChampionSelected":this.OnChampionSelected},
                options:{"include-none":true},
            }), 1);
        });
    }
    OnChampionSelected = (championElement, componentIdentifier)=>{
        $(componentIdentifier["triggerElement"])
        .attr("data-id", $(championElement).attr("data-id"))
        .val($(championElement).find("span").text())
        .change();
        this.LoadDescription();
    };

    LoadSelectSpell = (event)=>{
        return Promise.all([
            this.RemoveComponent("config-description"),
            this.RemoveSelectionComponents(),
        ]).then(()=>{
            if(this.components["summoner-spell-list"] !== undefined) return;
            return this.AddComponent("summoner-spell-list", Main_Part_SummonerSpellList, window.MakeData({
                identifier:{"triggerElement":event.currentTarget},
                functions:{"OnSpellSelected":this.OnSpellSelected},
                options:{"include-none":true},
            }), 1);
        });
    }
    OnSpellSelected = (spellElement, componentIdentifier)=>{
        $(componentIdentifier["triggerElement"])
        .attr("data-id", $(spellElement).attr("data-id"))
        .val($(spellElement).find("span").text())
        .change();
        this.LoadDescription();
    };

    LoadSelectRunePage = (event)=>{
        let triggerElement = $(event.currentTarget).closest(".runepage");
        return Promise.all([
            this.RemoveComponent("config-description"),
            this.RemoveSelectionComponents(),
        ]).then(()=>{
            let storedRunes = {};
            triggerElement.find(".option[data-type='rune-step']").get().forEach((option)=>{
                let stepName = $(option).attr("data-step");
                let stepPerk = parseInt(this.GetInputValue($(option).find("input")));
                if(isNaN(stepPerk) || stepPerk<0) return;
                if(!storedRunes[stepName]) storedRunes[stepName] = [stepPerk, ];
                else storedRunes[stepName].push(stepPerk);
            });
            return Promise.resolve(storedRunes);
        }).then((storedRunes)=>{
            if(this.components["select-rune-page"] !== undefined) return;
            return this.AddComponent("select-rune-page", Main_Part_SelectRunePage, window.MakeData({
                identifier:{"triggerElement":triggerElement,"runes":storedRunes},
                functions:{"OnSaveRunePage":this.OnSaveRunePage},
            }), 1);
        });
    }
    OnSaveRunePage = (runes, componentIdentifier)=>{
        let steps = $(componentIdentifier["triggerElement"]).find(".option[data-type='rune-step']");
        return new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json"
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))));
        }).then((icons)=>new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perkstyles.json"
            $.get(requestURL, {}, (data)=>resolve({...icons,...Object.fromEntries(data["styles"].map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))}));
        })).then((icons)=>{
            return Promise.resolve(steps.get().forEach((option)=>{
                let stepName = $(option).attr("data-step");
                if(!runes[stepName]) return;
                let pid = parseInt(runes[stepName].shift())||-1;
                $(option).find("input").val(pid);
                $(option).find("img").attr("src",icons[pid]?icons[pid]:"data:image/svg+xml;utf8,<svg></svg>");
            })).then(()=>Promise.resolve(steps.last().find("input").change()));
        }).then(()=>this.LoadDescription());
    };

    CatchKeyPress = (event)=>{
        if($(event.currentTarget).is(":focus") && event.keyCode in KEYCODE2KEY){
            $(event.currentTarget).attr("data-key", event.keyCode).val(KEYCODE2KEY[event.keyCode]).trigger("change", [true,]).blur();
        }
    }

    TypedConfigChange = (option)=>{
        let handler = ({
            "rune-step": (()=>new Promise((resolve, reject)=>{
                let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json"
                $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))));
            }).then((icons)=>new Promise((resolve, reject)=>{
                let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perkstyles.json"
                $.get(requestURL, {}, (data)=>resolve({...icons,...Object.fromEntries(data["styles"].map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))}));
            })).then((icons)=>{
                let value = parseInt(this.GetInputValue($(option).find("input")));
                return Promise.resolve($(option).find("img").attr("src",icons[value]?icons[value]:"data:image/svg+xml;utf8,<svg></svg>"));
            })),
        }[$(option).attr("data-type")]);
        return Promise.resolve(handler?handler():0);
    }

    OnConfigChange = (event, upload=true)=>{
        if(!upload) return Promise.resolve();
        return new Promise((resolve, reject)=>{
            let input = $(event.currentTarget);
            this.CheckDefaultCustom(input);
            let item = input.closest(".options-container");
            let path = this.GetConfigPath(item);
            return Promise.all(item.find(".option").get().map((option)=>new Promise((res, rej)=>{
                let inp = $(option).find("input");
                let val = this.GetInputValue(inp);
                let vld = this.CheckInputValid(inp);
                console.log(inp, val, vld);
                if(!vld) return res([]);
                res(this.TypedConfigChange(option).then(()=>Promise.resolve(
                    [$(option).attr("data-name"), val]
                )));
            }))).then((pairs)=>resolve([path, Object.fromEntries(pairs.filter((p)=>(p&&p.length===2)))]));
        }).then(([path, data])=>Promise.resolve(
            $.post(`/config/${path}`, data, ()=>{console.log("Config updated:", path, data)})
        )).then(()=>Promise.all(
            Object.values(this.components).map((c)=>Promise.resolve((c.ReloadContent?c.ReloadContent():0)))
        ));
    }
}