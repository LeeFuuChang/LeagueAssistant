class Main_Part_LolChallengeList extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/lol-challenge-list/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        window.Widgets.SetupTextFilter($(this.element).find(".lol-challenge-list>.block-inner"));
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.ReloadContent));
        this.ReloadContent();
    }

    CreateInnerItem = (container)=>{
        let html = `
        <div class="text-filter-item challenge hover-pointer" data-category-id="" data-category-rank="" data-id="" data-rank="">
            <div><div class="mask"></div></div>
            <div><img src="" alt=""></div>
            <div></div>
        </div>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        let container = $(this.element).find(".challenge-wrapper").empty();
        let optionsCategoryId = parseInt($(this.element).find(".filter-by-category .drop-down-menu-selected").attr("data-label"));
        new Promise((resolve, reject)=>{
            $.get("/riot/lcu/0/lol-challenges/v1/challenges/category-data", {}, (response)=>{
                if(!response["success"]) return reject();
                resolve(Object.fromEntries(Object.values(response["response"]).map((category)=>[
                    category["id"], {"id":category["id"], "currentLevel":category["currentLevel"]}
                ])));
            });
        }).then((categoriesData)=>{
            Object.values(categoriesData).forEach((c)=>$(this.element).find(`.filter-by-category .drop-down-menu-li[data-label="${c["id"]}"]`).attr("data-category-rank", c["currentLevel"]));
            return new Promise((resolve, reject)=>{
                $.get("/riot/lcu/0/lol-challenges/v1/challenges/local-player", {}, (response)=>{
                    if(!response["success"]) return reject();
                    let findChildrenIds = (parentId, categoryId)=>{
                        return [[parseInt(categoryId), parseInt(parentId)], ]
                        .concat(...response["response"][`${parentId}`]["childrenIds"]
                        .map((childId)=>findChildrenIds(childId, categoryId)));
                    };
                    let filterCategory = (c)=>{
                        let filteredByCategory = (optionsCategoryId<=0 || c[1]["parentId"]==optionsCategoryId);
                        let categoryAvailable = (categoriesData[c[1]["parentId"]]!==undefined);
                        return filteredByCategory&&categoryAvailable;
                    };
                    resolve([].concat(
                        ...Object.entries(response["response"])
                        .filter(filterCategory)
                        .sort((a, b)=>(parseInt(a[0])-parseInt(b[0])))
                        .map((c)=>findChildrenIds(c[0], c[1]["parentId"]))
                    ).map(([categoryId, challengeId])=>({"categoryData":categoriesData[categoryId], "challengeData":response["response"][`${challengeId}`]})));
                });
            });
        }).then((challengeDatas)=>{
            let addChallengeToDisplay = (challenges, index)=>{
                if(index >= challenges.length) return Promise.resolve();
                return new Promise((resolve, reject)=>{
                    let ele = this.CreateInnerItem(container);
                    let clg = challenges[index];
                    ele.attr({
                        "data-filter": `${clg["challengeData"]["id"]} ${clg["challengeData"]["name"]}`,
                        "data-category-id": clg["categoryData"]["id"],
                        "data-category-rank": clg["categoryData"]["currentLevel"],
                        "data-id": clg["challengeData"]["id"],
                        "data-rank": clg["challengeData"]["currentLevel"],
                    });
                    ele.find("div:nth-child(2) img").attr("src", window.ToCDragonPath(
                        clg["challengeData"]["levelToIconPath"][(clg["challengeData"]["currentLevel"]==="NONE")?"IRON":clg["challengeData"]["currentLevel"]]
                    ));
                    ele.find("div:nth-child(3)").text(clg["challengeData"]["name"]);
                    let ShowChallengeThreshold = this.data["functions"]["ShowChallengeThreshold"];
                    ele.on("click", function(){ShowChallengeThreshold($(this).attr("data-category-id"), $(this).attr("data-id"))});
                    resolve();
                }).then(()=>addChallengeToDisplay(challenges, index+1));
            };
            return addChallengeToDisplay(challengeDatas, 0);
        });
    }
}