class Main_Summoner extends AppBodyMain {
    static pageType = "summoner";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([
            [this.data["identifier"]["name"], this.data["identifier"]["class"], window.MakeData({summoner:this.data["summoner"]}), 0],
        ]);
    }
}