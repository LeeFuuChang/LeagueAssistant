class Side_Part_SummonerPositionPreference extends AppBodySide_Part {
    static elementURL = "/ui/assets/body/side/parts/summoner-position-preference/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        this.SetupPageControl([{
            pageName: "單雙積分",
            value: "rank5solo"
        }, {
            pageName: "彈性積分",
            value: "rank5flex"
        }, {
            pageName: "快打模式",
            value: "quickplay5"
        }, {
            pageName: "一般競技",
            value: "draft5"
        }], this.ReloadContent);
        this.ReloadContent();
    }

    SetDefault = ()=>{
        $(this.element)
        .find(".position-preference-inner .position-preference-bar .position-preference-item")
        .each(function(){
            let gamePlayed = 0;
            let averageKills = 0.0;
            let averageDeaths = 0.0;
            let averageAssists = 0.0;
            let averageKDA = 0.0;
            $(this).find(".position-detail-item[data-name='gamePlayed'] span").text(gamePlayed);
            $(this).find(".position-detail-item[data-name='averageKills'] span").text(averageKills);
            $(this).find(".position-detail-item[data-name='averageDeaths'] span").text(averageDeaths);
            $(this).find(".position-detail-item[data-name='averageAssists'] span").text(averageAssists);
            $(this).find(".position-detail-item[data-name='averageKDA'] span").text(averageKDA);
            $(this).css("--percentage", "20%");
        })
    }

    ReloadContent = ()=>{
        return new Promise((resolve, reject)=>{
            if(this.data["summoner"]["invalid"]) return resolve(this.SetDefault());
    
            let pageData = this.availablePages[this.currentPageIndex];
            let puuid = this.data["summoner"]["puuid"];
            let queue = pageData.value;
            let lastNYears = 2;
            let totalGames = 0;
            let timeNow = Date.now();
    
            this.SetDefault();

            $.post("/riot/lcu/0/lol-seasons/v1/allSeasons/product/LOL", `{"lastNYears":${lastNYears}}`, (response)=>{
                let seasonId = response["response"].filter((s)=>(s["seasonStart"] <= timeNow && timeNow <= s["seasonEnd"]))[0]["seasonId"];
                let items = $(this.element).find(".position-preference-inner .position-preference-bar .position-preference-item");
                items.each(function(i){
                    let requestURL = `/riot/lcu/0/lol-career-stats/v1/summoner-stats/${puuid}/${seasonId}/${queue}/${$(this).attr("position")}`;
                    let callback = (data)=>{
                        if(data["success"]){
                            let positionSummary = data["response"]["seasonSummary"][seasonId.toString()][queue]["positionSummaries"][$(this).attr("position")]["positionSummary"]["stats"]["CareerStats.js"];
                            let gamePlayed = parseInt(positionSummary["gamePlayed"]);
                            let averageKills = (positionSummary["kills"] / gamePlayed).toFixed(1);
                            let averageDeaths = (positionSummary["deaths"] / gamePlayed).toFixed(1);
                            let averageAssists = (positionSummary["assists"] / gamePlayed).toFixed(1);
                            let averageKDA = AppAlgo.calculateKDA(positionSummary["kills"], positionSummary["deaths"], positionSummary["assists"]).toFixed(1);
                            $(this).find(".position-detail-item[data-name='gamePlayed'] span").text(gamePlayed);
                            $(this).find(".position-detail-item[data-name='averageKills'] span").text(averageKills);
                            $(this).find(".position-detail-item[data-name='averageDeaths'] span").text(averageDeaths);
                            $(this).find(".position-detail-item[data-name='averageAssists'] span").text(averageAssists);
                            $(this).find(".position-detail-item[data-name='averageKDA'] span").text(averageKDA);
                            totalGames += gamePlayed;
                            $(this).prevAll().addBack().each(function(){
                                let gamePlayed = $(this).find(".position-detail-item[data-name='gamePlayed'] span").text();
                                $(this).css("--percentage", `${(parseInt(gamePlayed)/totalGames)*100}%`);
                            });
                        }
                    };
                    $.get(requestURL, {}, callback).always(()=>{if(i+1===items.length)resolve()});
                });
            });
        });
    }
}