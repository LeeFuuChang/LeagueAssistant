$(document).ready(()=>{
    $("#app-control-close").on("click", ()=>{
        $.post("/app/controls/app-control-close");
    });
    $("#app-control-settings").on("click", (e)=>{
        window.LoadClasses("assets/overlay/classes.json").then(()=>{
            window.LoadOverlay(AppOverlay_AppConfig, window.MakeData());
        });
    });
    $("#app-control-hide").on("click", ()=>{
        $.post("/app/controls/app-control-hide");
    });
    $("#app-control-support").on("click", (e)=>{
        window.LoadClasses("assets/overlay/classes.json").then(()=>{
            window.LoadOverlay(AppOverlay_AboutInfo, window.MakeData());
        });
    });
    $("#app-control-size").on("click", ()=>{
        $("#app-overlay").hide(0, ()=>window.resizeDisplay({
            "mode": {
                "expanded":"contract",
                "contract":"expanded"
            }[$("#app").attr("size")]
        }));
    });
    $("#app-control-discord").on("click", ()=>{
        $.post("/app/external", {"url":"https://discord.gg/k7wpKMnbY5"});
    });


    $("#page-controls-previous").on("click", (e)=>{
        window.LoadData(window.MakeData({summoner:SummonerIdentifier.PrevIdentifier()}));
    });
    $("#page-controls-next").on("click", (e)=>{
        window.LoadData(window.MakeData({summoner:SummonerIdentifier.NextIdentifier()}));
    });
    $("#page-controls-reload").on("click", (e)=>{
        window.reloadPage();
    });
    $("#page-controls-home").on("click", (e)=>{
        window.LoadHomePage();
    });
    $("#search-player").on("submit", ()=>{
        $("#search-player input").prop("disabled", 1).addClass("disabled");
        let name = $("#search-player input[type='text']").val();
        if(name){
            Promise.all([
                window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
                window.LoadClasses("assets/body/main/pages/lol-match-history/classes.json"),
            ]).then(()=>{
                SummonerIdentifier.FromDisplayName(name).then((identifier)=>{
                    window.LoadPage(Side_Summoner, Main_LolMatchHistory, window.MakeData({summoner:identifier}));
                });
            });
        }
        $("#search-player input").prop("disabled", 0).removeClass("disabled");
    });


    $("#app-nav-profile-lol-history").on("click", (e)=>{
        Promise.all([
            window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
            window.LoadClasses("assets/body/main/pages/lol-match-history/classes.json"),
        ]).then(()=>{
            if(SummonerIdentifier.currentIdentifier && !SummonerIdentifier.currentIdentifier.invalid){
                window.LoadMain(Main_LolMatchHistory, window.MakeData({summoner:SummonerIdentifier.currentIdentifier}));
            }else{
                SummonerIdentifier.CurrentSummoner().then((identifier)=>{
                    window.LoadPage(Side_Summoner, Main_LolMatchHistory, window.MakeData({summoner:identifier}));
                });
            }
        });
    });
    $("#app-nav-profile-tft-history").on("click", (e)=>{
        Promise.all([
            window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
            window.LoadClasses("assets/body/main/pages/tft-match-history/classes.json"),
        ]).then(()=>{
            if(SummonerIdentifier.currentIdentifier && !SummonerIdentifier.currentIdentifier.invalid){
                window.LoadMain(Main_TftMatchHistory, window.MakeData({summoner:SummonerIdentifier.currentIdentifier}));
            }else{
                SummonerIdentifier.CurrentSummoner().then((identifier)=>{
                    window.LoadPage(Side_Summoner, Main_TftMatchHistory, window.MakeData({summoner:identifier}));
                });
            }
        });
    });
    $("#app-nav-profile-chart").on("click", (e)=>{
        Promise.all([
            window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
            window.LoadClasses("assets/body/main/pages/summoner-recent-performance/classes.json"),
        ]).then(()=>{
            if(SummonerIdentifier.currentIdentifier && !SummonerIdentifier.currentIdentifier.invalid){
                window.LoadMain(Main_SummonerRecentPerformance, window.MakeData({
                    summoner:SummonerIdentifier.currentIdentifier,
                }));
            }else{
                SummonerIdentifier.CurrentSummoner().then((identifier)=>{
                    window.LoadPage(Side_Summoner, Main_SummonerRecentPerformance, window.MakeData({
                        summoner:identifier,
                    }));
                });
            }
        });
    });

    $("#app-nav-stats-lol").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/lol-trend/classes.json").then(()=>{
            window.LoadMain(Main_LolTrend, window.MakeData());
        });
    });
    $("#app-nav-stats-tft").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/tft-trend/classes.json").then(()=>{
            window.LoadMain(Main_TftTrend, window.MakeData());
        });
    });
    $("#app-nav-stats-challenges").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/lol-challenges/classes.json").then(()=>{
            window.LoadMain(Main_LolChallenges, window.MakeData());
        });
    });

    $("#app-nav-settings-game").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/config/classes.json").then(()=>{
            window.LoadMain(Main_Config, window.MakeData({identifier:{"name":"config-settings-game", "class":Main_Part_ConfigSettingsGame}}));
        });
    });
    $("#app-nav-settings-stats").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/config/classes.json").then(()=>{
            window.LoadMain(Main_Config, window.MakeData({identifier:{"name":"config-settings-stats", "class":Main_Part_ConfigSettingsStats}}));
        });
    });
    $("#app-nav-settings-spell").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/config/classes.json").then(()=>{
            window.LoadMain(Main_Config, window.MakeData({identifier:{"name":"config-settings-spell", "class":Main_Part_ConfigSettingsSpell}}));
        });
    });

    $("#app-nav-appearance-spell").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/config/classes.json").then(()=>{
            window.LoadMain(Main_Config, window.MakeData({identifier:{"name":"config-appearance-spell", "class":Main_Part_ConfigAppearanceSpell}}));
        });
    });

    $("#app-nav-fast-live").on("click", (e)=>{
        window.LoadClasses("assets/body/main/pages/live-inspect/classes.json").then(()=>{
            window.LoadMain(Main_LiveInspect, window.MakeData());
        });
    });
    $("#app-nav-fast-dodge").on("click", (e)=>{
        $.post("/riot/lcu/0/lol-login/v1/session/invoke", JSON.stringify({
            "destination": "lcdsServiceProxy",
            "method": "call",
            "args": '["", "teambuilder-draft", "quitV2", ""]'
        }));
    });
    $("#app-nav-fast-reload").on("click", (e)=>{
        $.post("/riot/lcu/0/riotclient/kill-and-restart-ux", {}, ()=>location.reload());
    });

    console.log("header.js loaded");
});