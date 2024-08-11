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
        return $.get("/app/version", {}).then((data)=>{
            $(this.element)
                .find(".content[data-name='version'] .group[data-name='current'] p")
                .text(data["current-version"] || "0");
            $(this.element)
                .find(".content[data-name='version'] .group[data-name='latest'] p")
                .text(data["latest-version"] || "0");
            $(this.element)
                .find(".content[data-name='version'] .group[data-name='update'] p")
                .text(data["release-date"] || "0000-00-00");
        });
    }
}