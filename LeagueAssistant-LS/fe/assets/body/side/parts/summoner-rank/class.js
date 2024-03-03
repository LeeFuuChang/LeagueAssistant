class Side_Part_SummonerRank extends AppBodySide_Part {
    static elementURL = "/ui/assets/body/side/parts/summoner-rank/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        this.SetupPageControl([{
            pageName: "召喚峽谷",
            value: [{
                displayName: "單雙積分",
                value: "RANKED_SOLO_5x5"
            }, {
                displayName: "彈性積分",
                value: "RANKED_FLEX_SR"
            }]
        }, {
            pageName: "聯盟戰棋",
            value: [{
                displayName: "戰棋積分",
                value: "RANKED_TFT"
            }, {
                displayName: "雙人搭檔",
                value: "RANKED_TFT_DOUBLE_UP"
            }]
        }], this.ReloadContent);
        this.ReloadContent();
    }

    SetDefault = ()=>{
        let container = $(this.element).find(".rank-inner");
        let pageData = this.availablePages[this.currentPageIndex];
        container.empty();
        pageData.value.forEach(item => {
            let tier = "unranked";
            let division = "NA";
            let wins = 0;
            let leaguePoints = 0;
            let ele = this.CreateInnerItem(container);
            ele.find(".rank-icon img").attr("src", 
                `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tier}.png`
            );
            ele.find(".rank-stats .rank-name span[data-name='tier']").text(window.Translate(tier.toUpperCase()));
            ele.find(".rank-stats .rank-name span[data-name='division']").text(window.Translate(division, division));
            ele.find(".rank-stats .rank-detail .rank-queue span[data-name='queueType']").text(item.displayName);
            ele.find(".rank-stats .rank-detail .rank-wins span[data-name='wins']").text(wins);
            ele.find(".rank-stats .rank-detail .rank-points span[data-name='leaguePoints']").text(leaguePoints);
        })
    }

    CreateInnerItem = (container)=>{
        let html = `
        <div class="rank-type">
            <div class="rank-icon">
                <img src="" alt="">
            </div>
            <div class="rank-stats">
                <div class="rank-name">
                    <span data-name="tier"></span>
                    <span data-name="division"></span>
                </div>
                <div class="rank-detail">
                    <div class="rank-queue">
                        <span data-name="queueType"></span>
                    </div>
                    <div class="rank-wins">
                        <span data-name="wins"></span>W
                    </div>
                    <div class="rank-points">
                        <span data-name="leaguePoints"></span>LP
                    </div>
                </div>
            </div>
        </div>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        return new Promise((resolve, reject)=>{
            if(this.data["summoner"]["invalid"]) return resolve(this.SetDefault());
    
            let container = $(this.element).find(".rank-inner");
            let pageData = this.availablePages[this.currentPageIndex];
            let puuid = this.data["summoner"]["puuid"];
    
            let requestURL = `/riot/lcu/0/lol-ranked/v1/ranked-stats/${puuid}`;
            $.get(requestURL, {}, (data)=>{
                if(data["success"]){
                    container.empty();
                    pageData.value.forEach(item => {
                        let itemData = data["response"]["queueMap"][item.value];
                        let tier = itemData["tier"].toLowerCase();
                        tier = (!tier || tier==="none") ? "unranked" : tier;
                        let division = itemData["division"];
                        let wins = itemData["wins"];
                        let leaguePoints = itemData["leaguePoints"];
                        let ele = this.CreateInnerItem(container);
                        ele.find(".rank-icon img").attr("src", 
                            `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tier}.png`
                        );
                        ele.find(".rank-stats .rank-name span[data-name='tier']").text(window.Translate(tier.toUpperCase()));
                        ele.find(".rank-stats .rank-name span[data-name='division']").text(window.Translate(division, division));
                        ele.find(".rank-stats .rank-detail .rank-queue span[data-name='queueType']").text(item.displayName);
                        ele.find(".rank-stats .rank-detail .rank-wins span[data-name='wins']").text(wins);
                        ele.find(".rank-stats .rank-detail .rank-points span[data-name='leaguePoints']").text(leaguePoints);
                    })
                }else this.SetDefault();
            }).always(()=>{resolve()});
        });
    }
}