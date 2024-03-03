class Main_TftMatchHistory extends AppBodyMain {
    static pageType = "tft";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": "tft-recent-matches", 
            "class": Main_Part_TftRecentMatches, 
            "data": window.MakeData({
                summoner: this.data["summoner"]
            }), 
        }]);
    }
}