window.PhaseHandler = (function(){
    this.lastHandledPhase = "";
    this.GetPhaseHandler = ((phase)=>{
        switch(phase){
            case "ChampSelect": return (()=>new Promise((resolve, reject)=>{
                $.get("/app/config/live-inspect", {}, (data)=>{
                    if(!data["auto-select-inspect"]) return resolve();
                    resolve(setTimeout(()=>{
                        Promise.all([
                            window.resizeDisplay({"mode":"expanded"}),
                            $.post("/app/controls/app-controls-show"),
                            window.LoadClasses("assets/body/main/pages/live-inspect/classes.json"),
                        ]).then(()=>window.LoadMain(Main_LiveInspect, window.MakeData()));
                    }, 3000));
                });
            }))
            case "InProgress": return (()=>new Promise((resolve, reject)=>{
                $.get("/app/config/live-inspect", {}, (data)=>{
                    if(!data["auto-ingame-inspect"]) return resolve();
                    resolve(setTimeout(()=>{
                        Promise.all([
                            window.resizeDisplay({"mode":"expanded"}),
                            $.post("/app/controls/app-controls-show"),
                            window.LoadClasses("assets/body/main/pages/live-inspect/classes.json"),
                        ]).then(()=>window.LoadMain(Main_LiveInspect, window.MakeData()));
                    }, 5000));
                });
            }))
            default: return (()=>Promise.resolve());
        }
    });
    this.Handle = ((phase)=>new Promise((resolve, reject)=>{
        if(!phase || phase===this.lastHandledPhase) return resolve();
        this.GetPhaseHandler(phase)().then(()=>resolve());
        this.lastHandledPhase = phase;
    }));
    return this;
})();


window.Updater = (function(){
    this.GetDeltaTime = ((success)=>(success?1000:5000));

    this.Update = (()=>{
        let prePromises = [
    
        ];
        let sufPromises = [
            // resize window base on league client
            (()=>new Promise((resolve, reject)=>{
                $.get("/riot/lcu/0/lol-settings/v2/local/video", {}, (request)=>{
                    let zoom = parseFloat(((request["response"]||{})["data"]||{})["ZoomScale"]);
                    if(!request["success"] || isNaN(zoom)) return resolve();
                    return window.resizeDisplay({"zoom":zoom}).then(()=>resolve());
                });
            })),

            // phase handles for auto page swapping
            (()=>new Promise((resolve, reject)=>{
                $.get("/riot/lcu/0/lol-gameflow/v1/gameflow-phase").then((request)=>{
                    return window.PhaseHandler.Handle((request["success"]?request["response"]:"")).then(()=>resolve());
                });
            })),
        ];

        return Promise.all(prePromises.map(f=>f()))
        .then(()=>$.get("/riot/lcu").then((s)=>{
            let available = JSON.parse(s);
            if(available && $("#app-cover").is(".loading__LCU")) window.reloadPage();
            $("#app-cover").toggleClass("loading__LCU", !available);
            return Promise.resolve(available);
        }))
        .then((s)=>new Promise((resolve, reject)=>{
            if(!s) return resolve(s);
            let timer = setTimeout(()=>resolve(s), this.GetDeltaTime(!s));
            Promise.all(sufPromises.map(f=>f())).then(()=>Promise.resolve(clearTimeout(timer))).then(()=>resolve(s));
        })).then((s)=>Promise.resolve(setTimeout(this.Update, this.GetDeltaTime(s))));
    });

    return this;
})();


$(document).ready(function(){setTimeout(window.Updater.Update, window.Updater.GetDeltaTime(1))});
