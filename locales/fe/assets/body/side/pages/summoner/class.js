class Side_Summoner extends AppBodySide {
    static pageType = "summoner";

    constructor(container, data){
        super(container, data);

        this.LoadComponents([{
            "name": "summoner-basic", 
            "class": Side_Part_SummonerBasic, 
            "data": this.data, 
        }, {
            "name": "summoner-position-preference", 
            "class": Side_Part_SummonerPositionPreference, 
            "data": this.data, 
        }, {
            "name": "summoner-rank", 
            "class": Side_Part_SummonerRank, 
            "data": this.data, 
        }, {
            "name": "summoner-mastery", 
            "class": Side_Part_SummonerMastery, 
            "data": this.data, 
        }, {
            "name": "summoner-recent-champion", 
            "class": Side_Part_SummonerRecentChampion, 
            "data": this.data, 
        }]);
    }
}
