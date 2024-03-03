class Main_SummonerSeasonOverview extends AppBodyMain {
    static pageType = "summoner";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": "summoner-season-overview",
            "class": Main_Part_SummonerSeasonOverview,
            "data": this.data,
        }]);
    }
}