class Side_Part_SummonerMastery extends AppBodySide_Part {
    static elementURL = "/ui/assets/body/side/parts/summoner-mastery/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        this.SetupPageControl([{
            pageName: "按照等級",
            value: (a,b)=>(b["championLevel"] - a["championLevel"] || b["championPoints"] - a["championPoints"])
        }, {
            pageName: "按照分數",
            value: (a,b)=>(b["championPoints"] - a["championPoints"])
        }], this.ReloadContent);
        this.ReloadContent();
    }

    ReloadContent = ()=>{
        let pageData = this.availablePages[this.currentPageIndex];
        return new Promise((resolve, reject)=>{
            let container = $(this.element).find(".mastery-inner").empty();
            if(this.data["summoner"]["invalid"]) return resolve();
            let summoner = this.data["summoner"];
            let requestURL = `/riot/lcu/0/lol-collections/v1/inventories/${summoner["summonerId"]}/champion-mastery`;
            $.get(requestURL, {}, (data)=>{
                if(!data["success"]) return resolve();
                let masteries = data["response"].filter((c)=>(c["championLevel"] >= 5)).sort(pageData.value).slice(0, 5);
                let html = masteries.map((m)=>`
                <div class="mastery-champion hover-detail-parent" data-champion-id="${m["championId"]}">
                    <div class="mastery-champion-icon">
                        <img src="https://cdn.communitydragon.org/latest/champion/${m["championId"]}/square" alt="">
                    </div>
                    <div class="mastery-champion-detail hover-detail-top">
                        <img src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-profiles/global/default/images/mastery_level${m["championLevel"]}.png" alt="">
                        <span class="mastery-champion-points">${m["championPoints"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    </div>
                </div>`).join("");
                container.html($(html)).find(".mastery-champion").on("click", function(){
                    window.LoadClasses("assets/body/main/pages/summoner-recent-performance/classes.json").then(()=>{
                        window.LoadMain(Main_SummonerRecentPerformance, window.MakeData({
                            summoner:summoner,
                            identifier:{"championId":$(this).data("championId")}
                        }));
                    });
                });
                return resolve();
            }).always(()=>resolve());
        });
    }
}