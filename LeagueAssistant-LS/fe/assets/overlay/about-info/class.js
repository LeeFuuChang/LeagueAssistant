class AppOverlay_AboutInfo extends AppOverlay {
    static elementURL = "/ui/assets/overlay/about-info/element.html";

    Setup = ()=>{
        window.Widgets.SetupButtonGroup($(this.element).find(".navigation .navigation-item"), this.ReloadContent);
        this.ReloadContent();
    }

    ReloadContent = ()=>{
        let active = $(this.element).find(".navigation .navigation-item.active").attr("data-name");
        $(this.element).find(".container .content").each(function(){
            $(this).toggle($(this).attr("data-name") === active);
        });
        $.get("/app/version", {}, (appVdata)=>{
            $.get("/storage/local/storage.version", {}, (data)=>{
                let feV = parseInt(data, 16);
                $(this.element)
                .find(".content[data-name='version'] .group[data-name='current'] p")
                .text(`${appVdata["current"]}.${feV}`);
            });
            $.get("/storage/cloud/struct.xml", {}, (data)=>{
                let feV = parseInt(data.documentElement.getAttribute("version"), 16);
                $(this.element)
                .find(".content[data-name='version'] .group[data-name='latest'] p")
                .text(`${appVdata["latest"]}.${feV}`);
            });
            $(this.element).find(".content[data-name='version'] .group[data-name='update'] p").text(appVdata["update"]);
        });
    }
}