$(document).ready(()=>{
    window.Footer = {
        marqueeLines: [],
        updateMarquee: (lines)=>{
            if(!Array.isArray(lines)) return Promise.resolve();
            window.Footer.marqueeLines = lines;
            return Promise.resolve(
                $("#app-footer").html(`<ul class="marquee-content">${
                    lines.map((s)=>`<li>${s}${"&emsp;".repeat(6)}</li>`).join("")
                }</ul>`.repeat(2)).css("--marquee-speed", `${lines.length*10}s`)
            );
        }
    };

    window.Footer.updateMarquee([
        "歡迎大家加入 Discord 討論群~", 
        "有任何功能建議都可以提出哦~",
    ])
    console.log("footer.js loaded");
});