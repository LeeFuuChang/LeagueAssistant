class Main_SummonerRecentPerformance extends AppBodyMain {
    static pageType = "summoner";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": "summoner-recent-performance",
            "class": Main_Part_SummonerRecentPerformance,
            "data": this.data,
        }]);
    }
}