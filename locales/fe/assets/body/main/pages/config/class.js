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
            "keydown": (e)=>{
                if($(e.currentTarget).is(":focus") && e.keyCode in KEYCODE2KEY){
                    $(e.currentTarget).attr("data-key", e.keyCode).val(KEYCODE2KEY[e.keyCode]).trigger("change").blur();
                }
            },
            "mousedown": (e)=>{
                if(e.button !== 2) return;
                $(e.currentTarget).attr("data-key", "-1").val("").trigger("change");
            },
        });

        $(this.element).find(".config-item .item-options .option .nickname-set")
            .on("change", (e)=>{
                let preset = Object.getPrototypeOf(this).constructor.nicknameSets||{};
                let values = preset[$(e.currentTarget).attr("key")]||[];
                $(`.nickname[name="${$(e.currentTarget).attr("name")}"]`).each(function(i){
                    $(this).val(values[i]||"").prop("readonly", !!values[i]);
                }).last().trigger("change");
            });

        $(this.element)
            .find(".config-item .item-options .option input[path]")
            .on("change", (e)=>{
                return new Promise((resolve, reject)=>{
                    let data = {};
                    for(let inp of $(`input[path="${$(e.target).attr("path")}"]`)) {
                        if(!this.CheckInputValid(inp)) continue;
                        data[$(inp).attr("key")] = this.GetInputValue(inp);
                    }
                    return resolve(data);
                }).then((data)=>{
                    return $.post(`/app/config/${$(e.target).attr("path")}`, JSON.stringify(data));
                }).then(()=>this.ReloadContent());
            });

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
        let configPromise = new Promise((resolve, reject)=>{
            return Promise.all([...new Set($("input[path]").get().map(inp=>$(inp).attr("path")))].map(p=>{
                return new Promise((res, rej)=>$.get(`/app/config/${p}`).done(data=>res([p, data])).fail(()=>rej()));
            })).then((entries)=>resolve(Object.fromEntries(entries)));
        });
        return Promise.all([
            championNamesPromise,
            summonerSpellNamesPromise,
            perkIconsPromise,
            configPromise,
        ]).then(([
            championNames,
            summonerSpellNames,
            perkIcons,
            config,
        ])=>{
            Object.keys(config).forEach((path)=>{
                Object.keys(config[path]).forEach((key)=>{
                    let input = $(this.element).find(`input[path="${path}"][key="${key}"]`);

                    if($(input).is(".switch")){
                        $(input).prop("checked", config[path][key]);
                    }else if($(input).is(".checkbox")){
                        $(input).prop("checked", config[path][key]);
                    }else if($(input).is(".slider")){
                        $(input).val(parseInt(config[path][key]));
                    }else if($(input).is(".keybind")){
                        $(input).attr("data-key", config[path][key]).val(KEYCODE2KEY[config[path][key]]);
                    }else if($(input).is(".champion")){
                        let championId = config[path][key];
                        if(championNames[championId] === undefined) championId = -1;
                        $(input).attr("data-id", championId);
                        $(input).val(championNames[championId]);
                    }else if($(input).is(".spell")){
                        let spellId = config[path][key];
                        if(summonerSpellNames[spellId] === undefined) spellId = -1;
                        $(input).attr("data-id", spellId);
                        $(input).val(spellId>0?summonerSpellNames[spellId]:"無");
                    }else if($(input).is(".rune")){
                        let perkId = config[path][key];
                        $(input).val(perkId).siblings("img").attr("src",
                            perkIcons[perkId]?perkIcons[perkId]:"data:image/svg+xml;utf8,<svg></svg>"
                        );
                    }else if($(input).is(".text-preview")){
                        $(input).val("");
                    }else{
                        $(input).val(config[path][key]);
                    }

                    if($(input).is(".nickname-set:checked")){
                        let preset = Object.getPrototypeOf(this).constructor.nicknameSets||{};
                        let values = preset[$(input).attr("key")]||[];
                        $(`.nickname[name="${$(input).attr("name")}"]`).each(function(i){
                            $(this).prop("readonly", !!values[i]);
                        });
                    }

                    this.CheckInputValid(input);
                });
            });
            return Promise.resolve();
        });
    }

    GetInputValue = (input)=>{
        let value;
        if($(input).is(".switch")){
            value = $(input).is(":checked");
        }else if($(input).is(".checkbox")){
            value = $(input).is(":checked");
        }else if($(input).is(".slider")){
            value = parseInt($(input).val());
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
                    "LoadDescription": this.LoadDescription,
                    "LoadItemDescription": this.LoadItemDescription,
                    "LoadSelectChampion": this.LoadSelectChampion,
                    "LoadSelectSpell": this.LoadSelectSpell,
                    "LoadSelectRunePage": this.LoadSelectRunePage,
                }
            }),
        }, {
            "name": "config-description",
            "class": Main_Part_ConfigDescription,
            "data": window.MakeData(),
        }])
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
    OnChampionSelected = (lowerAlias, position, championElement, componentIdentifier)=>{
        $(componentIdentifier["triggerElement"])
            .attr("data-id", $(championElement).attr("data-id"))
            .val($(championElement).find("span").text()).change();
        this.LoadDescription();
    }

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
            .val($(spellElement).find("span").text()).change();
        this.LoadDescription();
    }

    LoadSelectRunePage = (event)=>{
        let triggerElement = $(event.currentTarget).closest(".runepage");
        return Promise.all([
            this.RemoveComponent("config-description"),
            this.RemoveSelectionComponents(),
        ]).then(()=>{
            let storedRunes = {};
            triggerElement.find(".option[data-type='rune-step']").get().forEach((option)=>{
                let stepName = $(option).attr("data-step");
                let stepPerk = parseInt($(option).find("input").val())||-1;
                if(isNaN(stepPerk) || stepPerk<0) return;
                if(!storedRunes[stepName]) storedRunes[stepName] = [stepPerk, ];
                else storedRunes[stepName].push(stepPerk);
            });
            return Promise.resolve(storedRunes);
        }).then((storedRunes)=>{
            if(this.components["select-rune-page"] !== undefined) return;
            return this.AddComponent("select-rune-page", Main_Part_SelectRunePage, window.MakeData({
                identifier:{"triggerElement":triggerElement,"runes":storedRunes},
                functions:{"OnRunePageSelected":this.OnRunePageSelected},
            }), 1);
        });
    }
    OnRunePageSelected = (runes, componentIdentifier)=>{
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
    }
}