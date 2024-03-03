class AppOverlay {
    constructor(container, data){
        $("#app-overlay").empty().on("click", (e)=>{
            if($(e.target).is("#app-overlay")) this.SlideOut();
        });
        this.data = data;
        this.elementContainer = container;
        this.CreateElement().then(()=>this.Setup());
    }

    CreateElement = ()=>{
        return new Promise((resolve, reject) => {
            $.get(Object.getPrototypeOf(this).constructor.elementURL, {}, (html)=>{
                this.element = $(html).appendTo(this.elementContainer);
                resolve(this.element);
            });
        }).then(()=>this.SlideIn());
    }

    IsReady = ()=>{
        return new Promise((resolve, reject)=>{
            let callback = (func, intervalId, timeoutId)=>{
                clearInterval(intervalId);
                clearTimeout(timeoutId);
                func();
            }
            let timeoutId = setTimeout(()=>{
                callback(reject, intervalId, timeoutId);
            }, 3000);
            let intervalId = setInterval(()=>{
                if(!this.element) return;
                callback(resolve, intervalId, timeoutId);
            }, 300);
        })
    }

    SlideIn = ()=>{
        return new Promise((resolve, reject)=>{
            setTimeout(reject, 3000);
            $("#app-overlay").show(0, ()=>{
                $(this.element)
                .css("top", "100%")
                .show(0)
                .animate({"top":"0%"}, 300, "linear", resolve);
            });
        });
    }

    SlideOut = ()=>{
        return new Promise((resolve, reject)=>{
            setTimeout(reject, 3000);
            $(this.element)
            .css("top", "0%")
            .animate({"top":"100%"}, 300, "linear", function(){
                $("#app-overlay").hide(0, resolve);
            });
        }).then(()=>{
            return new Promise((resolve, reject)=>{
                if(this.element) $(this.element).remove()
                resolve();
            });
        });
    }
}

$(document).ready(()=>{
    LoadOverlay = (overlayClass, data)=>{
        return new Promise((resolve, reject)=>{
            if(!window.Overlay) resolve();
            else window.Overlay.SlideOut().then(()=>{resolve()});
        }).then(()=>{
            window.Overlay = new overlayClass($("#app-overlay"), data);
            return window.Overlay.IsReady();
        });
    };
    window.LoadOverlay = LoadOverlay;

    console.log("overlay.js loaded");
});