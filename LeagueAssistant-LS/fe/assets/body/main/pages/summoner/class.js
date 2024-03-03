class Main_Summoner extends AppBodyMain {
    static pageType = "summoner";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": this.data["identifier"]["name"],
            "class": this.data["identifier"]["class"],
            "data": window.MakeData({
                summoner: this.data["summoner"]
            }),
        }]);
    }
}