class Main_Part_SelectRunePage extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/select-rune-page/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.startingStepName = "primary-style";
        this.currentStepName = this.startingStepName;
        this.selectRuneSteps = {
            "primary-style": {
                "quantity": 1,
                "name": "primary-style",
                "prev": null,
                "next": "primary-keystone",
                "setup": (stylesData, perkIcons)=>{
                    let c = $(this.element).find(".rune-row[data-step='primary-style']").empty().show(0);
                    return Promise.resolve(Object.keys(stylesData).sort().forEach((perkId)=>this.CreateInnerItem(
                        c, perkId, "r-0-0", stylesData[perkId]["name"].toLowerCase(), stylesData[perkId]["icon"]
                    )));
                },
                "validate": (runes, stylesData)=>{
                    if(!runes["primary-style"]) return false;
                    return (stylesData[runes["primary-style"][0]] !== undefined)
                },
            },
            "primary-keystone": {
                "quantity": 1,
                "name": "primary-keystone",
                "prev": "primary-style",
                "next": "primary-perks",
                "setup": (stylesData, perkIcons)=>{
                    let selectedPrimaryStyleId = this.data["identifier"]["runes"]["primary-style"][0];
                    let selectedPrimaryStyleName = stylesData[selectedPrimaryStyleId]["name"].toLowerCase();
                    if(stylesData[selectedPrimaryStyleId] === undefined) return Promise.resolve();
                    let c = $(this.element).find(".rune-row[data-step='primary-keystone']").empty().show(0);
                    return Promise.resolve(stylesData[selectedPrimaryStyleId]["keystones"].forEach((perkId)=>{
                        if(perkIcons[perkId] === undefined) return;
                        return this.CreateInnerItem(c, perkId, "r-0-1", selectedPrimaryStyleName, perkIcons[perkId]);
                    }));
                },
                "validate": (runes, stylesData)=>{
                    if(!runes["primary-keystone"]) return false;
                    let selectedPrimaryStyleId = runes["primary-style"][0];
                    let selectedPrimaryKeystoneId = runes["primary-keystone"][0];
                    if(stylesData[selectedPrimaryStyleId] === undefined) return false;
                    return stylesData[selectedPrimaryStyleId]["keystones"].includes(selectedPrimaryKeystoneId);
                },
            },
            "primary-perks": {
                "quantity": 3,
                "name": "primary-perks",
                "prev": "primary-keystone",
                "next": "secondary-style",
                "setup": (stylesData, perkIcons)=>{
                    let selectedPrimaryStyleId = this.data["identifier"]["runes"]["primary-style"][0];
                    let selectedPrimaryStyleName = stylesData[selectedPrimaryStyleId]["name"].toLowerCase();
                    if(stylesData[selectedPrimaryStyleId] === undefined) return Promise.resolve();
                    let c = $(this.element).find(".rune-row[data-step='primary-perks']").empty().show(0);
                    return Promise.resolve(stylesData[selectedPrimaryStyleId]["groups"].map((g,i)=>g.forEach((perkId)=>{
                        if(perkIcons[perkId] === undefined) return;
                        return this.CreateInnerItem(c.eq(i), perkId, `r-0-2-${i}`, selectedPrimaryStyleName, perkIcons[perkId]);
                    })));
                },
                "validate": (runes, stylesData)=>{
                    if(!runes["primary-perks"]) return false;

                    let selectedPrimaryStyleId = runes["primary-style"][0];
                    if(stylesData[selectedPrimaryStyleId] === undefined) return false;

                    let selectedCount = runes["primary-perks"].length;
                    let requiredCount = this.selectRuneSteps["primary-perks"]["quantity"];
                    if(selectedCount < requiredCount) return false;

                    let perks = stylesData[selectedPrimaryStyleId]["groups"].flat();
                    return (runes["primary-perks"].reduce((a,b)=>(a+!perks.includes(b)),0)===0);
                },
            },
            "secondary-style": {
                "quantity": 1,
                "name": "secondary-style",
                "prev": "primary-perks",
                "next": "secondary-perks",
                "setup": (stylesData, perkIcons)=>{
                    let selectedPrimaryStyleId = this.data["identifier"]["runes"]["primary-style"][0];
                    if(stylesData[selectedPrimaryStyleId] === undefined) return Promise.resolve();
                    let allowedStyles = stylesData[selectedPrimaryStyleId]["allowed-secondary-styles"];
                    let c = $(this.element).find(".rune-row[data-step='secondary-style']").empty().show(0);
                    allowedStyles.sort().forEach((perkId)=>{
                        if(stylesData[perkId] !== undefined) this.CreateInnerItem(
                            c, perkId, "r-1-0", stylesData[perkId]["name"].toLowerCase(), stylesData[perkId]["icon"]
                        )
                    });
                },
                "validate": (runes, stylesData)=>{
                    if(!runes["secondary-style"]) return false;
                    let selectedPrimaryStyleId = runes["primary-style"][0];
                    let selectedSecondaryStyleId = runes["secondary-style"][0];
                    if(stylesData[selectedPrimaryStyleId] === undefined) return false;
                    if(stylesData[selectedSecondaryStyleId] === undefined) return false;
                    return (selectedPrimaryStyleId !== selectedSecondaryStyleId);
                },
            },
            "secondary-perks": {
                "quantity": 2,
                "name": "secondary-perks",
                "prev": "secondary-style",
                "next": "statmods",
                "setup": (stylesData, perkIcons)=>{
                    let selectedSecondaryStyleId = this.data["identifier"]["runes"]["secondary-style"][0];
                    let selectedSecondaryStyleName = stylesData[selectedSecondaryStyleId]["name"].toLowerCase();
                    if(stylesData[selectedSecondaryStyleId] === undefined) return Promise.resolve();
                    let c = $(this.element).find(".rune-row[data-step='secondary-perks']").empty().show(0);
                    return Promise.resolve(stylesData[selectedSecondaryStyleId]["groups"].map((g,i)=>g.forEach((perkId)=>{
                        if(perkIcons[perkId] === undefined) return;
                        return this.CreateInnerItem(c.eq(i), perkId, `r-1-2-${i}`, selectedSecondaryStyleName, perkIcons[perkId]);
                    })));
                },
                "validate": (runes, stylesData)=>{
                    if(!runes["secondary-perks"]) return false;

                    let selectedSecondaryStyleId = runes["secondary-style"][0];
                    if(stylesData[selectedSecondaryStyleId] === undefined) return false;

                    let selectedCount = runes["secondary-perks"].length;
                    let requiredCount = this.selectRuneSteps["secondary-perks"]["quantity"];
                    if(selectedCount < requiredCount) return false;

                    let perks = stylesData[selectedSecondaryStyleId]["groups"].flat();
                    return (runes["secondary-perks"].reduce((a,b)=>(a+!perks.includes(b)),0)===0);
                },
            },
            "statmods": {
                "quantity": 3,
                "name": "statmods",
                "prev": "secondary-perks",
                "next": null,
                "setup": (stylesData, perkIcons)=>{
                    let selectedPrimaryStyleId = this.data["identifier"]["runes"]["primary-style"][0];
                    if(stylesData[selectedPrimaryStyleId] === undefined) return Promise.resolve();
                    let c = $(this.element).find(".rune-row[data-step='statmods']").empty().show(0);
                    return Promise.resolve(stylesData[selectedPrimaryStyleId]["statmods"].map((s,i)=>s.forEach((perkId)=>{
                        if(perkIcons[perkId] === undefined) return;
                        return this.CreateInnerItem(c.eq(i), perkId, `r-2-${i}`, "statmods", perkIcons[perkId]);
                    })));
                },
                "validate": (runes, stylesData)=>{
                    if(!runes["statmods"]) return false;

                    let selectedPrimaryStyleId = runes["primary-style"][0];
                    if(stylesData[selectedPrimaryStyleId] === undefined) return false;

                    let selectedCount = runes["statmods"].length;
                    let requiredCount = this.selectRuneSteps["statmods"]["quantity"];
                    if(selectedCount < requiredCount) return false;

                    let A = stylesData[selectedPrimaryStyleId]["statmods"];
                    let B = runes["statmods"];
                    return (B.reduce((a,b)=>(a+!A.flat().includes(b)),0)===0);
                },
            },
        };
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        return new Promise((resolve,reject)=>{
            if(!this.data["identifier"]["runes"]) this.data["identifier"]["runes"] = {};
            resolve(Object.entries(this.selectRuneSteps).forEach(([stepName, stepData])=>{
                let storedRuneStep = this.data["identifier"]["runes"][stepName];
                if(!storedRuneStep || storedRuneStep.length!==stepData["quantity"]){
                    this.data["identifier"]["runes"][stepName] = [];
                }
            }));
        }).then(()=>this.FetchPerksData())
        .then(([perkStyles, perkIcons])=>this.SetupSteps(perkStyles, perkIcons))
        .then(()=>Promise.resolve($(this.element).find(".button-container .rune-save").on("click", this.SaveRunePage)))
        .then(()=>Promise.resolve($(this.element).find(".button-container .rune-clear").on("click", this.ClearAllSteps)))
        .then(()=>this.ReloadContent());
    }

    SetupSteps = (perkStyles, perkIcons)=>{
        return new Promise((resolve, reject)=>{
            let runeRows = $(this.element).find(`.rune-row[data-step='${this.currentStepName}']`);
            let showRows = $(this.element).find(`.rune-row[data-step='${this.currentStepName}']:visible`);
            let stepData = this.selectRuneSteps[this.currentStepName];
            Promise.resolve((runeRows.length>showRows.length)?stepData["setup"](perkStyles, perkIcons):0).then(()=>{
                let valid = stepData["validate"](this.data["identifier"]["runes"], perkStyles);
                if(valid) runeRows.removeClass("invalid");
                // runeRows.toggleClass("invalid", !valid);
                if(!valid) return resolve(this.ClearStepsBelow(this.currentStepName));
                let stepRows = $(this.element).find(`.rune-row[data-step='${stepData["name"]}']`).get();
                let stepBoard = stepRows.map(r=>$(r).find(".option").get().map(o=>parseInt($(o).attr("data-id"))));
                ((perks)=>{
                    let rec = (idx, mapping, rowIds)=>{
                        if(idx==perks.length) return mapping;
                        let result = null;
                        for(let row of rowIds){
                            if(!stepBoard[row].includes(perks[idx])) continue;
                            result = rec(idx+1,mapping.map((v,i)=>(i==idx?row:v)),[...rowIds].filter(i=>i!=row));
                            if(result) break;
                        }
                        return result;
                    };
                    return rec(0, [...perks.keys()], [...stepBoard.keys()]).map((r,i)=>[perks[i],r]);
                })(this.data["identifier"]["runes"][stepData["name"]]).forEach(([perkId, rowId])=>{
                    $(this.element)
                    .find(`.rune-row[data-step='${stepData["name"]}']`).eq(rowId)
                    .find(`.option[data-id=${perkId}] input`).first().prop("checked", 1);
                });
                if(stepData["next"]===null) return resolve();
                this.currentStepName = stepData["next"];
                return resolve(this.SetupSteps(perkStyles, perkIcons));
            });
        });
    }

    CreateInnerItem = (container, perkId, radioName, perkStyle, perkIcon)=>{
        let html = `
        <label class="option hover-pointer" data-style="${perkStyle}" data-id="${perkId}">
            <input tabindex="-1" type="radio" name=${radioName}>
            <img src="${perkIcon}" alt="">
            <span class="ring"></span>
        </label>`;
        return $(html).appendTo(container).find("input").on("click", this.OnPerkSelected);
    }

    OnPerkSelected = (e)=>{
        let input = $(e.currentTarget);
        let stepName = input.closest(".rune-row").attr("data-step");
        let stepData = this.selectRuneSteps[stepName];
        return this.FetchPerksData().then(([perkStyles, perkIcons])=>{
            if(stepName !== this.currentStepName){
                this.currentStepName = stepName;
                this.ClearStepsBelow(stepName);
            };

            let perkId = parseInt(input.closest(".option").attr("data-id"));
            this.data["identifier"]["runes"][stepName].push(perkId);

            let selectedPerkIds = $(this.element)
                .find(`.rune-row[data-step='${stepName}'] .option input:checked`).get()
                .map((opt)=>parseInt($(opt).closest(".option").attr("data-id")));
            Object.entries(((A, B)=>Object.fromEntries(
                [...new Set(B)].map(n=>[n,B.filter(m=>m==n).length-A.filter(m=>m==n).length]).filter(p=>p[1]>0)
            ))(selectedPerkIds, this.data["identifier"]["runes"][stepName])).forEach(([pid,cnt])=>{
                this.data["identifier"]["runes"][stepName] = this.data["identifier"]["runes"][stepName].filter(p=>(p!=pid||!cnt)?1:(cnt--&&0));
            });

            while(this.data["identifier"]["runes"][stepName].length > stepData["quantity"]){
                let shifted = this.data["identifier"]["runes"][stepName].shift();
                $(this.element).find(`.rune-row[data-step='${stepName}'] .option[data-id="${shifted}"] input:checked`).first().prop("checked", 0);
            };

            if(this.data["identifier"]["runes"][stepName].length < stepData["quantity"]) return Promise.resolve(this.ClearStepsBelow(stepName));
            let valid = stepData["validate"](this.data["identifier"]["runes"], perkStyles);
            $(this.element).find(`.rune-row[data-step='${stepName}']`).toggleClass("invalid", !valid);
            return Promise.resolve(valid?this.SetupSteps(perkStyles,perkIcons):this.ClearStepsBelow(stepName));
        });
    }

    FetchPerksData = ()=>{
        let perkStylesPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perkstyles.json"
            $.get(requestURL, {}, (data)=>{
                resolve(Object.fromEntries(data["styles"].map((p)=>[parseInt(p["id"]), {
                    "id": p["id"],
                    "name": p["name"],
                    "icon": window.ToCDragonPath(p["iconPath"]),
                    "allowed-secondary-styles": p["allowedSubStyles"],
                    "keystones": p["slots"][0]["perks"],
                    "groups": [
                        p["slots"][1]["perks"],
                        p["slots"][2]["perks"],
                        p["slots"][3]["perks"],
                    ],
                    "statmods": [
                        p["slots"][4]["perks"],
                        p["slots"][5]["perks"],
                        p["slots"][6]["perks"],
                    ],
                }])));
            });
        });
        let perkIconsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json"
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))));
        });
        return Promise.all([
            perkStylesPromise,
            perkIconsPromise,
        ]);
    }

    ClearStepsBelow = (stepName)=>{
        let tempStepName = this.selectRuneSteps[stepName]["next"];
        while(tempStepName !== null && this.selectRuneSteps[tempStepName]){
            $(this.element).find(`.rune-row[data-step='${tempStepName}']`).empty().hide(0);
            this.data["identifier"]["runes"][tempStepName] = [];
            tempStepName = this.selectRuneSteps[tempStepName]["next"];
        }
    }

    ClearAllSteps = ()=>{
        this.ClearStepsBelow(this.startingStepName);
        $(this.element).find(".option input").prop("checked", 0);
        this.currentStepName = this.startingStepName;
    }

    ValidateRunePage = (runes)=>{
        return this.FetchPerksData().then(([ps, pi])=>{
            let invalidStep = "";
            let tempStepName = this.startingStepName;
            while(tempStepName !== null && this.selectRuneSteps[tempStepName] && !invalidStep){
                let isValid = this.selectRuneSteps[tempStepName]["validate"](runes, ps);
                if(!isValid && !invalidStep) invalidStep = tempStepName;
                $(this.element).find(`.rune-row[data-step='${tempStepName}']`).toggleClass("invalid", !!invalidStep);
                tempStepName = this.selectRuneSteps[tempStepName]["next"];
            };
            return Promise.resolve([runes, invalidStep]);
        });
    }

    SaveRunePage = ()=>{
        return Promise.resolve(Object.fromEntries(Object.keys(this.selectRuneSteps).map((stepName)=>[stepName,[]])))
        .then((runes)=>{
            $(".rune-row").get().forEach((row)=>{
                let stepName = $(row).attr("data-step");
                let rowSelected = $(row).find(".option input:checked").first();
                if(!rowSelected.length) return;
                let perkId = parseInt(rowSelected.closest(".option").attr("data-id"));
                runes[stepName].push(perkId);
            });
            return Promise.resolve(runes);
        })
        .then((runes)=>this.ValidateRunePage(runes))
        .then(([runes, invalidStep])=>{
            this.data["identifier"]["runes"] = runes;
            if(invalidStep) return Promise.resolve(this.ClearStepsBelow(invalidStep));
            this.data["functions"]["OnRunePageSelected"](runes, this.data["identifier"]);
        });
    }
}