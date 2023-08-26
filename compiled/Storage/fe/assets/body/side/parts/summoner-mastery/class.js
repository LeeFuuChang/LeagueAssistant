class Side_Part_SummonerMastery extends AppBodySide_Part {
    static elementURL = "/ui/assets/body/side/parts/summoner-mastery/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        this.SetupPageControl([{
            pageName: "按照分數",
            value: "championPoints"
        }, {
            pageName: "按照等級",
            value: "championLevel"
        }], this.ReloadContent);
        this.ReloadContent();
    }

    SetDefault = ()=>{
        let container = $(this.element).find(".mastery-inner");
        container.empty();
    }

    CreateInnerItem = (container)=>{
        let html = `
        <div class="mastery-champion hover-detail-parent">
            <div class="mastery-champion-icon">
                <img src="" alt="">
            </div>
            <div class="mastery-champion-detail hover-detail-top">
                <img src="" alt="">
                <span class="mastery-champion-points"></span>
            </div>
        </div>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        return new Promise((resolve, reject)=>{
            if(this.data["summoner"]["invalid"]) return resolve(this.SetDefault());
    
            let container = $(this.element).find(".mastery-inner");
            let pageData = this.availablePages[this.currentPageIndex];
            let summonerId = this.data["summoner"]["summonerId"];
    
            let requestURL = `/riot/lcu/0/lol-collections/v1/inventories/${summonerId}/champion-mastery`;
            $.get(requestURL, {}, (data)=>{
                if(data["success"]){
                    container.empty();
                    let masteries = data["response"]
                    .filter((c)=>(c["championLevel"] >= 5))
                    .sort((a, b)=>(b[pageData.value] - a[pageData.value]));
                    for(let i=0; i<Math.min(5, masteries.length); i++){
                        let championId = masteries[i]["championId"];
                        let championLevel = masteries[i]["championLevel"];
                        let championPoints = masteries[i]["championPoints"];
                        let ele = this.CreateInnerItem(container);
                        ele.find(".mastery-champion-icon img").attr("src",
                            `https://cdn.communitydragon.org/latest/champion/${championId}/square`
                        );
                        ele.find(".mastery-champion-detail img").attr("src",
                            `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-profiles/global/default/images/mastery_level${championLevel}.png`
                        );
                        ele.find(".mastery-champion-detail .mastery-champion-points").text(championPoints.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                    }
                }else this.SetDefault();
            }).always(()=>{resolve()});
        });
    }
}