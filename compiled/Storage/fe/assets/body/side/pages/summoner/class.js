class Side_Summoner extends AppBodySide {
    static pageType = "summoner";

    constructor(container, data){
        super(container, data);

        this.LoadComponents([
            ["summoner-basic", Side_Part_SummonerBasic, window.MakeData({summoner:this.data["summoner"]}), 0],
            ["summoner-position-preference", Side_Part_SummonerPositionPreference, window.MakeData({summoner:this.data["summoner"]}), 1],
            ["summoner-rank", Side_Part_SummonerRank, window.MakeData({summoner:this.data["summoner"]}), 2],
            ["summoner-mastery", Side_Part_SummonerMastery, window.MakeData({summoner:this.data["summoner"]}), 3],
            ["summoner-recent-champion", Side_Part_SummonerRecentChampion, window.MakeData({summoner:this.data["summoner"]}), 4],
        ]);
    }
}
