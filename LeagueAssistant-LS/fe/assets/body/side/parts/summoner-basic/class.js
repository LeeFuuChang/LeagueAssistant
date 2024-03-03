class Side_Part_SummonerBasic extends AppBodySide_Part {
    static elementURL = "/ui/assets/body/side/parts/summoner-basic/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.ReloadContent());
    }

    ReloadContent = ()=>{
        return new Promise((resolve, reject)=>{
            let displayName = this.data["summoner"]["gameName"];
            let puuid = this.data["summoner"]["puuid"];
            let summonerId = this.data["summoner"]["summonerId"];
            let percentCompleteForNextLevel = this.data["summoner"]["percentCompleteForNextLevel"];
            let profileIconId = this.data["summoner"]["profileIconId"];
            let summonerLevel = this.data["summoner"]["summonerLevel"];
    
            $(this.element).find(".summoner-icon .xp-progress")
                .css("--progress", `${percentCompleteForNextLevel}%`)
                .find("img").attr("src", `https://cdn.communitydragon.org/latest/profile-icon/${profileIconId}`);
            $(this.element).find(".summoner-icon .level span").text(summonerLevel);

            $(this.element).find(".summoner-info .name").text(displayName);
            $.get(`/riot/lcu/0/lol-challenges/v1/summary-player-data/player/${puuid}`, {}, (request)=>{
                if(!request["success"]) return;
                let title = request["response"]["title"]["challengeTitleData"];
                if(!title) return;
                $(this.element).find(".summoner-info .title")
                    .attr("data-rank", title["level"].toLowerCase())
                    .text(title["challengeName"]);
            });
            $.get(`/riot/mmr/${summonerId}`, {}, (request)=>{
                if(!request["success"]) return;
                let mmr = parseInt(request["response"]);
                $(this.element).find(".summoner-info .mmr").text(((mmr&&!isNaN(mmr))?mmr:"-"));
            });

            resolve();
        });
    }
}