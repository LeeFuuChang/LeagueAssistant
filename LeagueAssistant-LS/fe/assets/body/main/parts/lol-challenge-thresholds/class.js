class Main_Part_LolChallengeThresholds extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/lol-challenge-thresholds/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.ReloadContent));
        window.Widgets.SetupButtonGroup($(this.element).find(".thresholds-options .options-category .option-category-item"), this.ReloadContent);
        this.ReloadContent();
    }

    CreateInnerItem = (container)=>{
        let html = `
        <li data-category-id="" data-category-rank="" data-id="" data-rank="">
            <div class="li-d"><div class="mask"></div></div>
            <div class="li-d"><img src="" alt=""></div>
            <div class="li-d"></div>
            <div class="li-d" data-rank="IRON"><span>-</span></div>
            <div class="li-d" data-rank="BRONZE"><span>-</span></div>
            <div class="li-d" data-rank="SILVER"><span>-</span></div>
            <div class="li-d" data-rank="GOLD"><span>-</span></div>
            <div class="li-d" data-rank="PLATINUM"><span>-</span></div>
            <div class="li-d" data-rank="DIAMOND"><span>-</span></div>
            <div class="li-d" data-rank="MASTER"><span>-</span></div>
            <div class="li-d" data-rank="GRANDMASTER"><span>-</span></div>
            <div class="li-d" data-rank="CHALLENGER"><span>-</span></div>
        </li>`;
        return $(html).appendTo(container);
    }

    ShowChallengeDetail = (challengeData)=>{
        let detailElement = $(this.element).find(".challenge-detail");
        let currentRankData = challengeData["challengeData"]["currentLevel"];
        let challengeCurrentRank = (!currentRankData||currentRankData==="NONE")?"IRON":currentRankData;
        let nextRankData = challengeData["challengeData"]["nextLevel"];
        let challengeNextRank = (!nextRankData||nextRankData==="NONE")?challengeCurrentRank:nextRankData;

        detailElement.attr({
            "data-category-id": challengeData["categoryData"]["id"],
            "data-category-rank": challengeData["categoryData"]["currentLevel"],
            "data-id": challengeData["challengeData"]["id"],
            "data-rank": challengeData["challengeData"]["currentLevel"],
        });

        detailElement.find(".challenge-icon img").attr("src", window.ToCDragonPath(
            challengeData["challengeData"]["levelToIconPath"][challengeCurrentRank]
        ));
        detailElement.find(".challenge-stat .challenge-name").text(challengeData["challengeData"]["name"]);

        detailElement.find(".challenge-stat .challenge-description").html(challengeData["challengeData"]["descriptionShort"]);

        detailElement.find(".challenge-stat .challenge-stages .prev").attr("data-rank", challengeCurrentRank)
        .text(challengeData["challengeData"]["currentThreshold"]);
        detailElement.find(".challenge-stat .challenge-stages .current").attr("data-rank", challengeCurrentRank)
        .text(challengeData["challengeData"]["currentValue"]);
        detailElement.find(".challenge-stat .challenge-stages .next").attr("data-rank", challengeNextRank)
        .text(challengeData["challengeData"]["nextThreshold"]);

        let percentage = (challengeData["challengeData"]["currentValue"]/Math.max(1, challengeData["challengeData"]["nextThreshold"]));
        detailElement.find(".challenge-stat .challenge-progress .percentage-bar-item").css("--percentage", `${isNaN(percentage)?0:Math.min(percentage*100, 100)}%`);
    }

    ShowChallengeThreshold = (challengeCategoryId, challengeId)=>{
        challengeCategoryId = parseInt(challengeCategoryId);
        return new Promise((resolve, reject)=>{
            let optionCategoryItems = $(this.element).find(".options-category .option-category-item");
            let currentCategoryId = optionCategoryItems.filter(".active").attr("data-category-id");
            if(currentCategoryId == challengeCategoryId) return resolve();
            optionCategoryItems.removeClass("active").filter(`[data-category-id=${challengeCategoryId}]`).addClass("active");
            return resolve(this.ReloadContent());
        }).then(()=>{
            let target = $(this.element).find(`[data-id=${challengeId}]`);
            $(target).closest(".y-scrollable").animate({
                "scrollTop":$(target).prevAll().get().reduce((a,b)=>(a+$(b).height()),0)
            }, 1000, ()=>{$(target).effect("highlight", {"color":"var(--highlight-color)"}, 2000)});
            return Promise.resolve();
        });
    }

    ReloadContent = ()=>{
        let container = $(this.element).find(".block-inner .thresholds-table .body-ul").empty();
        let optionsRankRegex = new RegExp(`^.*${$(this.element).find(".options-rank .drop-down-menu-selected").attr("data-label")}$`, "i");
        let optionsCategoryId = parseInt($(this.element).find(".options-category .option-category-item.active").attr("data-category-id"));
        return new Promise((resolve, reject)=>{
            $.get("/riot/lcu/0/lol-challenges/v1/challenges/category-data", {}, (response)=>{
                if(!response["success"]) return reject();
                resolve(Object.fromEntries(Object.values(response["response"]).filter((c)=>(c["parentId"]>=0)).map((category)=>[
                    category["id"], {"id":category["id"], "currentLevel":category["currentLevel"]}
                ])));
            });
        }).then((categoriesData)=>{
            if(categoriesData[optionsCategoryId] !== undefined){
                $(this.element).find(".block-inner .thresholds-table .head-ul li").attr({
                    "data-category-id": categoriesData[optionsCategoryId]["id"],
                    "data-category-rank": categoriesData[optionsCategoryId]["currentLevel"],
                }).find(".li-d:nth-child(1) .mask").show(0);
            }else $(this.element).find(".block-inner .thresholds-table .head-ul li .li-d:nth-child(1) .mask").hide(0);
            return new Promise((resolve, reject)=>{
                $.get("/riot/lcu/0/lol-challenges/v1/challenges/local-player", {}, (response)=>{
                    if(!response["success"]) return reject();
                    let findChildrenIds = (parentId, categoryId)=>{
                        let parent = response["response"][`${parentId}`];
                        let filteredRank = optionsRankRegex.exec(parent["currentLevel"]);
                        return (filteredRank?[[parseInt(categoryId), parseInt(parentId)], ]:[])
                        .concat(...parent["childrenIds"].map((childId)=>findChildrenIds(childId, categoryId)));
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
                        "data-category-id": clg["categoryData"]["id"],
                        "data-category-rank": clg["categoryData"]["currentLevel"],
                        "data-id": clg["challengeData"]["id"],
                        "data-rank": clg["challengeData"]["currentLevel"],
                    });
                    ele.find(".li-d:nth-child(2) img").attr("src", window.ToCDragonPath(
                        clg["challengeData"]["levelToIconPath"][(clg["challengeData"]["currentLevel"]==="NONE")?"IRON":clg["challengeData"]["currentLevel"]]
                    ));
                    ele.find(".li-d:nth-child(3)").text(clg["challengeData"]["name"]);
                    Object.entries(clg["challengeData"]["thresholds"]).forEach(([key, value])=>{
                        ele.find(`.li-d[data-rank=${key}] span`).text(Math.abbreviate(value["value"]).join(""));
                    });
                    ele.on("mouseover", ()=>this.ShowChallengeDetail(clg));
                    ele.ready(()=>resolve(ele));
                }).then(()=>addChallengeToDisplay(challenges, index+1));
            };
            return addChallengeToDisplay(challengeDatas, 0).then(()=>{
                return Promise.resolve(this.ShowChallengeDetail(challengeDatas[0]));
            });
        });
    }
}