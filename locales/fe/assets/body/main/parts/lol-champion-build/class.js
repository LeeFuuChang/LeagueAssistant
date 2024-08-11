class Main_Part_LolChampionBuild extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/lol-champion-build/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.ReloadContent));
        window.Widgets.SetupButtonGroup($(this.element).find(".navigation .nav-item"), this.ReloadContent);
        this.ReloadContent();
    }

    SetDefault = ()=>{
        return Promise.all([
            $(this.element).find(".icon").empty(),
            $(this.element).find("strong").empty(),
            $(this.element).find(".champion-skill .column").attr("data-skill", ""),
        ]);
    }

    FetchStaticData = (championId, lang)=>{
        let gameDataURL = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${lang||"default"}/v1`;
        let championDataPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/champions/${championId}.json`, {}, (data)=>resolve(data));
        });
        let championSummaryPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/champion-summary.json`, {}, (data)=>resolve(Object.fromEntries(data.map((c)=>[parseInt(c.id),c]))));
        });
        let itemIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/items.json`, {}, (data)=>resolve(Object.fromEntries(data.map((i)=>[parseInt(i.id),window.ToCDragonPath(i["iconPath"])]))));
        });
        let perkIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/perks.json`, {}, (data)=>resolve(Object.fromEntries(data.map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))));
        }).then((icons)=>new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/perkstyles.json`, {}, (data)=>resolve({...icons,...Object.fromEntries(data["styles"].map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))}));
        }));
        let summonerSpellIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/summoner-spells.json`, {}, (data)=>resolve(Object.fromEntries(data.map(s=>[parseInt(s.id), window.ToCDragonPath(s["iconPath"])]))));
        });
        return Promise.all([
            championDataPromise,
            championSummaryPromise,
            itemIconsPromise,
            perkIconsPromise,
            summonerSpellIconsPromise,
        ]);
    }

    ReloadContent = ()=>{
        let identifierLowerAlias = this.data["identifier"]["lower-alias"];
        let identifierPosition = this.data["identifier"]["position"]||"";
        let gameMode = $(this.element).find(".navigation .nav-item.active");
        let rankTier = $(this.element).find(".options-rank .drop-down-menu-selected");

        let requestURL;
        switch(gameMode.attr("data-label")){
            case "aram":
                requestURL = `/opgg/lol/modes/aram/${
                    identifierLowerAlias
                }/build?region=global`;
                break;
            case "urf":
                requestURL = `/opgg/lol/modes/urf/${
                    identifierLowerAlias
                }/build?region=global`;
                break;
            default:
                requestURL = `/opgg/lol/champions/${
                    identifierLowerAlias
                }/build/${
                    (identifierPosition?`${identifierPosition.toLowerCase()}`:"")
                }?region=global&tier=${
                    rankTier.attr("data-label")
                }`;
                break;
        }
        return $.get(requestURL, {}, (pageProps)=>{
            let championPosition = (pageProps["position"]||identifierPosition).toLowerCase();
            let championId = pageProps["data"]["summary"]["summary"]["id"];
            let championTier = pageProps["data"]["summary"]["summary"]["average_stats"]["tier"];
            $(this.element)
            .find(".champion-banner .champion-icon").attr("data-tier", championTier)
            .find("img").attr("src", `https://cdn.communitydragon.org/latest/champion/${championId}/tile`);
            this.SetDefault().then(()=>this.FetchStaticData(championId, "zh_tw")).then(([
                championData,
                championSummary,
                itemIcons,
                perkIcons,
                summonerSpellIcons,
            ])=>{
                $(this.element).find(".champion-banner .champion-info").css("background-image", `url(${window.ToCDragonPath(
                    championData["skins"].map(s=>s["splashPath"]).filter(p=>p).sort(()=>(0.5-Math.random()))[0]
                )})`).find(".champion-name").text(championData["name"]);

                try{ // champion-runes
                    let cell_runes = $(this.element).find(".champion-build .cell.champion-runes");
                    let runeset = pageProps["data"]["rune_pages"][0];
                    if(runeset){
                        let primaryStyleId = runeset["builds"][0]["primary_page_id"];
                        let primaryKeystoneId = runeset["builds"][0]["primary_rune_ids"][0];
                        let secondaryStyleId = runeset["builds"][0]["secondary_page_id"];
                        let primaryPerkIds = [
                            runeset["builds"][0]["primary_rune_ids"][1],
                            runeset["builds"][0]["primary_rune_ids"][2],
                            runeset["builds"][0]["primary_rune_ids"][3],
                        ];
                        let secondaryPerkIds = [
                            runeset["builds"][0]["secondary_rune_ids"][0],
                            runeset["builds"][0]["secondary_rune_ids"][1],
                        ];
                        let statsmodIds = [
                            runeset["builds"][0]["stat_mod_ids"][0],
                            runeset["builds"][0]["stat_mod_ids"][1],
                            runeset["builds"][0]["stat_mod_ids"][2],
                        ];
                        cell_runes.find(".row[data-step='primary-keystone']").html(`<img src="${perkIcons[primaryKeystoneId]}" alt="">`);
                        cell_runes.find(".row[data-step='secondary-style']").html(`<img src="${perkIcons[secondaryStyleId]}" alt="">`);
                        [
                            ["primary-perks", primaryPerkIds],
                            ["secondary-perks", secondaryPerkIds],
                            ["statsmod", statsmodIds],
                        ].forEach(([dataStep, stepPerkIds])=>{
                            stepPerkIds.forEach((perkId, idx)=>{
                                cell_runes.find(`.row[data-step="${dataStep}"]`).eq(idx).html(`<img src="${perkIcons[perkId]}" alt="">`);
                            });
                        });
                        cell_runes.find(".apply-button .action-button").on("click", ()=>{
                            return new Promise((resolve, reject)=>{
                                let currentPageRequestURL = "/riot/lcu/0/lol-perks/v1/currentpage";
                                $.get(currentPageRequestURL, {}, (currentPage)=>resolve(currentPage));
                            }).then((currentPage)=>{
                                return new Promise((resolve, reject)=>{
                                    if(currentPage["success"]){
                                        let deletePageRequestURL = `/riot/lcu/0/lol-perks/v1/pages/${currentPage["response"]["id"]}`;
                                        $.ajax({url: deletePageRequestURL, type: "DELETE"}).always(()=>resolve());
                                    }else resolve()
                                });
                            }).then(()=>{
                                $.post("/riot/lcu/0/lol-perks/v1/pages", JSON.stringify({
                                    "name": `LA - ${championData["name"]}`,
                                    "primaryStyleId": primaryStyleId,
                                    "subStyleId": secondaryStyleId,
                                    "selectedPerkIds": [
                                        primaryKeystoneId,
                                        ...primaryPerkIds,
                                        ...secondaryPerkIds,
                                        ...statsmodIds,
                                    ],
                                    "current": true,
                                }));
                            });
                        });
                    }
                }catch(e){console.log(e)}

                try{ // champion-cores
                    let cell_cores = $(this.element).find(".champion-build .cell.champion-cores");
                    pageProps["data"]["core_items"].slice(0, 5).forEach((coreItems, rowIdx)=>{
                        coreItems["ids"].slice(0, 4).forEach((itemId, idx)=>{
                            cell_cores.find(".icon-container").eq(rowIdx)
                                .find(".icon").eq(idx).html(`<img src="${itemIcons[itemId]}" alt="">`);
                        });
                    })
                }catch(e){console.log(e)}

                try{ // champion-spell
                    let cell_spell = $(this.element).find(".champion-build .cell.champion-spell");
                    let dataSpell = pageProps["data"]["summoner_spells"][0];
                    dataSpell["ids"].slice(0, 2).sort((a,b)=>(b-a)).forEach((spellId, idx)=>{
                        cell_spell.find(".icon").eq(idx).html(`<img src="${summonerSpellIcons[spellId]}" alt="">`);
                    });
                }catch(e){console.log(e)}

                try{ // champion-boots
                    let cell_boots = $(this.element).find(".champion-build .cell.champion-boots");
                    pageProps["data"]["boots"].slice(0, 2).forEach((boot, idx)=>{
                        cell_boots.find(".icon").eq(idx).html(`<img src="${itemIcons[boot["ids"][0]]}" alt="">`);
                    });
                }catch(e){console.log(e)}

                try{ // champion-starters
                    let cell_starters = $(this.element).find(".champion-build .cell.champion-starters");
                    let amountOf = pageProps["data"]["starter_items"][0]["ids"].reduce((d,i)=>{if(!d[i]){d[i]=1}else{d[i]++}return d},{});
                    Object.keys(amountOf).sort((a,b)=>(amountOf[a]-amountOf[b])).forEach((itemId, idx)=>{
                        cell_starters.find(".icon").eq(idx).html(`<img src="${itemIcons[itemId]}" alt="">`);
                    });
                }catch(e){console.log(e)}

                try{ // champion-items
                    let cell_items = $(this.element).find(".champion-build .cell.champion-items");
                    pageProps["data"]["last_items"].slice(0, 9).forEach((item, idx)=>{
                        cell_items.find(".icon").eq(idx).html(`<img src="${itemIcons[item["ids"][0]]}" alt="">`);
                    });
                }catch(e){console.log(e)}

                try{ // champion-skill
                    let cell_skill = $(this.element).find(".champion-build .cell.champion-skill");
                    cell_skill.find(".column[data-level='0']").last().find(".skill").each(function(){
                        $(this).html(`<img src="${`
                            https://cdn.communitydragon.org/latest/champion/${championId}/ability-icon/${$(this).attr("data-skill").toLowerCase()}
                        `}" alt="">`);
                    });
                    pageProps["data"]["skills"][0]["order"].slice(0, 15).forEach((skill, index)=>{
                        cell_skill.find(`.column[data-level="${index+1}"]`).attr("data-skill", skill.toUpperCase())
                    });
                }catch(e){console.log(e)}

                try{ // champion-duo
                    let cell_duo = $(this.element).find(".champion-build .cell.champion-duo");
                    let opggPos2qqPos = {"top":"top","jungle":"jungle","mid":"mid","adc":"bottom","support":"support"};
                    let fetchData = (currentDate, fetched, count, depth, maxDepth)=>{
                        if(fetched.length >= count || depth >= maxDepth) return Promise.resolve(fetched.slice(0, count));
                        return new Promise((resolve, reject)=>{
                            currentDate.setDate(currentDate.getDate() - 1);
                            $.get("/qq/native/getRankDouble", {
                                "championid": championId,
                                "date": currentDate.toISOString().split('T')[0].split("-").join(""),
                                "tier": 999,
                                "lane1": opggPos2qqPos[championPosition],
                                "lane2": opggPos2qqPos[championPosition],
                                "pagesize": count,
                                "pageindex": 0,
                            }, (data)=>{
                                if(!data["data"]) return resolve(fetched);
                                return resolve(fetched.concat(data["data"]).filter((val,idx,arr)=>{
                                    return (!arr.slice(0,idx).some(c=>(c["championid2"]===val["championid2"])));
                                }));
                            });
                        }).then((newFetched)=>fetchData(currentDate, newFetched, count, depth+1, maxDepth));
                    };
                    let duo_champions = cell_duo.find(".other-champion")
                    fetchData(new Date(), [], duo_champions.length, 0, 9).then((duos)=>{
                        duos.sort((a,b)=>b["itemp1"].localeCompare(a["itemp1"])).forEach((data, idx)=>{
                            let duo_champion = duo_champions.eq(idx);
                            duo_champion.attr("data-lower-alias", championSummary[data["championid2"]]["alias"].toLowerCase());
                            duo_champion.find(".icon").html(`<img src="
                                https://cdn.communitydragon.org/latest/champion/${data["championid2"]}/square
                            " alt="">`);
                            duo_champion.find(".stat .winrate strong").text((data["doublewinrate"]*100).toFixed(2));
                            duo_champion.find(".stat .games strong").text(data["itemp1"]);
                            let identifier = this.data["identifier"];
                            let OnChampionSelected = this.data["functions"]["OnChampionSelected"];
                            duo_champion.on("click", function(){
                                OnChampionSelected(championSummary[data["championid2"]]["alias"].toLowerCase(), null, $(this), identifier);
                            });
                        });
                    });
                }catch(e){console.log(e)}

                try{ // champion-match
                    let cell_match = $(this.element).find(".champion-build .cell.champion-match");
                    let counters = (pageProps["data"]["summary"]["counters"]||[]).map((data)=>({
                        "id":data["champion_id"], "key":data["meta"]["key"], "win":data["win"], "play":data["play"],
                    })).sort((a,b)=>((a["win"]/a["play"])-(b["win"]/b["play"])));
                    let cell_match_hard_champions = cell_match.find(".match-group[data-difficulty='hard'] .other-champion");
                    counters.slice(0,cell_match_hard_champions.length).forEach((data, idx)=>{
                        let hard_champion = cell_match_hard_champions.eq(idx);
                        hard_champion.attr("data-lower-alias", championSummary[data["id"]]["alias"].toLowerCase());
                        hard_champion.find(".icon").html(`<img src="https://cdn.communitydragon.org/latest/champion/${data["id"]}/square" alt="">`);
                        hard_champion.find(".stat .winrate strong").text(((data["win"]/data["play"])*100).toFixed(2));
                        hard_champion.find(".stat .games strong").text(data["play"]);
                        let identifier = this.data["identifier"];
                        let OnChampionSelected = this.data["functions"]["OnChampionSelected"];
                        hard_champion.on("click", function(){
                            OnChampionSelected(championSummary[data["id"]]["alias"].toLowerCase(), null, $(this), identifier);
                        });
                    });
                    let cell_match_easy_champions = cell_match.find(".match-group[data-difficulty='easy'] .other-champion");
                    counters.slice(0-cell_match_easy_champions.length).reverse().forEach((data, idx)=>{
                        let easy_champion = cell_match_easy_champions.eq(idx);
                        easy_champion.attr("data-lower-alias", championSummary[data["id"]]["alias"].toLowerCase());
                        easy_champion.find(".icon").html(`<img src="https://cdn.communitydragon.org/latest/champion/${data["id"]}/square" alt="">`);
                        easy_champion.find(".stat .winrate strong").text(((data["win"]/data["play"])*100).toFixed(2));
                        easy_champion.find(".stat .games strong").text(data["play"]);
                        let identifier = this.data["identifier"];
                        let OnChampionSelected = this.data["functions"]["OnChampionSelected"];
                        easy_champion.on("click", function(){
                            OnChampionSelected(championSummary[data["id"]]["alias"].toLowerCase(), null, $(this), identifier);
                        });
                    });
                }catch(e){console.log(e)}
            });
        });
    }
}