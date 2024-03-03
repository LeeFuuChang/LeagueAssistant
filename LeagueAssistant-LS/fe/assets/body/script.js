class AppBodyBlock_Part_Abstract {
    constructor(container, data, index){
        this.elementContainer = container;
        this.element = undefined;
        this.data = data;
        this.index = index;
    }

    CreateElement = ()=>{
        return new Promise((resolve, reject) => {
            $.get(Object.getPrototypeOf(this).constructor.elementURL, {}, (html)=>{
                this.element = $(html).appendTo(this.elementContainer);
                resolve(this.element);
            });
        });
    }

    SetupPageControl = (availablePages, onPageChanged)=>{
        let pageName = $(this.element).find(".block-title .block-title-page .block-page-name");
        let prevButton = $(this.element).find(".block-title .block-title-page .block-page-prev");
        let nextButton = $(this.element).find(".block-title .block-title-page .block-page-next");
        this.currentPageIndex = 0;
        this.availablePages = availablePages;
        this.SetPage = (pageIndex)=>{
            this.currentPageIndex = pageIndex%this.availablePages.length;
            pageName.text(this.availablePages[this.currentPageIndex].pageName);
            prevButton.toggleClass("disabled", this.currentPageIndex === 0);
            nextButton.toggleClass("disabled", this.currentPageIndex === this.availablePages.length - 1);
        };
        this.NextPage = ()=>{
            let pageFrom = this.availablePages[this.currentPageIndex];
            this.SetPage(this.currentPageIndex + 1);
            let pageTo = this.availablePages[this.currentPageIndex];
            onPageChanged(pageFrom, pageTo);
        };
        this.PrevPage = ()=>{
            let pageFrom = this.availablePages[this.currentPageIndex];
            this.SetPage(this.currentPageIndex - 1);
            let pageTo = this.availablePages[this.currentPageIndex];
            onPageChanged(pageFrom, pageTo);
        };
        prevButton.on("click", ()=>{this.PrevPage()});
        nextButton.on("click", ()=>{this.NextPage()});
        this.SetPage(this.currentPageIndex);
    }
}



class AppBodyBlock_Abstract {
    constructor(container, data){
        this.container = container.empty();
        this.container.attr("type", Object.getPrototypeOf(this).constructor.pageType);

        this.data = data;

        this.components = {};
    }

    IsComponentReady = (component)=>{
        return new Promise((resolve, reject)=>{
            let interval = setInterval(()=>{
                if(component.element === undefined) return;
                resolve(clearInterval(interval));
            }, 300);
            setTimeout(()=>resolve(clearInterval(interval)), 3000);
        });
    }

    IsReady = ()=>{
        return Promise.all(Object.values(this.components).map((c)=>this.IsComponentReady(c)));
    }

    ReorderComponents = ()=>{
        return Promise.resolve(
            Object.values(this.components).sort((a, b)=>(a.index-b.index))
        ).then((sortedComponents)=>{
            for(let i=0,swapped=false; i<sortedComponents.length-1; i++,swapped=false){
                for(let j=0; j<sortedComponents.length-i-1; j++){
                    let elementA = $(sortedComponents[j].element);
                    let elementB = $(sortedComponents[j+1].element);
                    swapped = (elementA.index() > elementB.index());
                    if(swapped) elementA.after(elementB);
                }
                if(!swapped) break;
            }
            return Promise.resolve();
        });
    }

    RemoveMismatchedComponents = ()=>{
        return Promise.all(
            $(this.container).children().get().filter((child)=>(
                !(Object.values(this.components).some((c)=>$(c.element).is($(child))))
            )).map((child)=>Promise.resolve($(child).remove()))
        ).then(()=>this.ReorderComponents());
    }

    LoadComponents = (loading)=>{
        let direction = Object.getPrototypeOf(this).constructor.animationDirection;
        let load = (idx)=>{
            if(idx >= loading.length) return Promise.resolve();
            this.components[loading[idx].name] = new loading[idx].class(this.container, loading[idx].data, idx);
            return this.IsComponentReady(this.components[loading[idx].name]).then(()=>load(idx+1));
        };
        return load(0).then(()=>this.SlideIn(((c)=>{
            return (!$(c.element).is(":visible") || ($(c.element)[0].style[direction].slice(0, -1) !== "0"));
        })));
    }

    AddComponent = (name, cls, data, index=0)=>{
        let direction = Object.getPrototypeOf(this).constructor.animationDirection;
        return this.SlideOut((c)=>(c.index>=index)).then(()=>{
            this.components[name] = new cls(this.container, data, index);
            return this.IsComponentReady(this.components[name]);
        }).then(()=>this.SlideIn(((c)=>{
            return (!$(c.element).is(":visible") || ($(c.element)[0].style[direction].slice(0, -1) !== "0"));
        })));
    }

    RemoveComponent = (name)=>{
        let direction = Object.getPrototypeOf(this).constructor.animationDirection;
        return this.SlideOut((c)=>(this.components[name] && c.index>=this.components[name].index)).then(()=>{
            if(this.components[name] === undefined) return Promise.resolve();
            $(this.components[name].element).remove()
            delete this.components[name];
            return Promise.resolve();
        }).then(()=>this.SlideIn(((c)=>{
            return (!$(c.element).is(":visible") || ($(c.element)[0].style[direction].slice(0, -1) !== "0"));
        })));
    }

    SlideIn = (predicate=((value, index, array)=>true))=>{
        let direction = Object.getPrototypeOf(this).constructor.animationDirection;
        return this.RemoveMismatchedComponents().then(()=>Promise.all(
            Object.values(this.components)
            .sort((a, b)=>(a.index-b.index))
            .filter(predicate)
            .map((c, i)=>{
                return new Promise((resolve, reject)=>{
                    setTimeout(reject, 3000);
                    $(c.element).css(direction, "100%").show(0).delay(i*100)
                    .animate(Object.fromEntries([
                        [direction, "0%"],
                    ]), 500, "linear", ()=>resolve($(c.element).show(0)));
                });
            })
        ));
    }

    SlideOut = (predicate=((value, index, array)=>true))=>{
        let direction = Object.getPrototypeOf(this).constructor.animationDirection;
        return this.RemoveMismatchedComponents().then(()=>Promise.all(
            Object.values(this.components)
            .sort((a, b)=>(b.index-a.index))
            .filter(predicate)
            .map((c, i)=>{
                return new Promise((resolve, reject)=>{
                    setTimeout(reject, 3000);
                    $(c.element).css(direction, "0%").show(0).delay(i*100)
                    .animate(Object.fromEntries([
                        [direction, "100%"],
                    ]), 500, "linear", ()=>resolve($(c.element).hide(0)));
                });
            })
        ));
    }
}



$(document).ready(()=>{
    LoadSide = (sideClass, data)=>{
        return new Promise((resolve, reject)=>{
            if(!window.Side) resolve();
            else window.Side.SlideOut().then(()=>resolve());
        }).then(()=>{
            window.Side = new sideClass($(".app-body-side .body-part-container").empty(), data);
            return window.Side.IsReady();
        });
    };
    window.LoadSide = LoadSide;

    LoadMain = (mainClass, data)=>{
        return new Promise((resolve, reject)=>{
            if(!window.Main) resolve();
            else window.Main.SlideOut().then(()=>resolve());
        }).then(()=>{
            window.Main = new mainClass($(".app-body-main").empty(), data);
            return window.Main.IsReady();
        });
    };
    window.LoadMain = LoadMain;

    LoadPage = (sideClass, mainClass, data)=>{
        return Promise.all([
            window.LoadSide(sideClass, data),
            window.LoadMain(mainClass, data),
        ]);
    };
    window.LoadPage = LoadPage;

    reloadPage = ()=>{
        if(window.Side && window.Main){
            let sideConstructor = Object.getPrototypeOf(window.Side).constructor;
            let mainConstructor = Object.getPrototypeOf(window.Main).constructor;
            window.LoadSide(sideConstructor, window.Side.data);
            window.LoadMain(mainConstructor, window.Main.data);
        }else window.LoadHomePage();
    }
    window.reloadPage = reloadPage;

    LoadData = (data)=>{
        LoadPage(
            Object.getPrototypeOf(window.Side).constructor, 
            Object.getPrototypeOf(window.Main).constructor, 
            data
        );
    };
    window.LoadData = LoadData;

    console.log("body.js loaded");
});