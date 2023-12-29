import * as d3 from "d3";
import Toastify from "toastify-js";

const parser = new DOMParser();

const section = document.querySelector("section")!;

const english_svg = await fetch("english.svg").then((res) => res.text());
const chinese_svg = await fetch("chinese.svg").then((res) => res.text());

const english_wrapper = document.createElement("div");
const chinese_wrapper = document.createElement("div");

english_wrapper.append(parser.parseFromString(english_svg, "text/xml").childNodes[0]);
chinese_wrapper.append(parser.parseFromString(chinese_svg, "text/xml").childNodes[0]);

section.append(english_wrapper, chinese_wrapper);

const ctx = document.createElement("canvas").getContext("2d")!;

document.querySelectorAll("text").forEach((text) => {
    ctx.font = `${text.style.fontSize} ${text.style.fontFamily}`;

    const metrics = ctx.measureText(text.textContent!);
    const width = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft;
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    rect.dataset.word = text.textContent!;
    rect.dataset.value = text.dataset.value;

    rect.setAttributeNS(null, "x", (Number(text.dataset.x) - width / 2).toString());
    rect.setAttributeNS(
        null,
        "y",
        (Number(text.dataset.y) - height / 2 - (metrics as any).hangingBaseline / 2).toString()
    );
    rect.setAttributeNS(null, "width", width.toString());
    rect.setAttributeNS(null, "height", (height * 1.1).toString());
    rect.setAttributeNS(null, "fill", "rgba(0, 0, 0, 0)");

    text.parentNode!.insertBefore(rect, text.nextSibling);
});

const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

const article = document.querySelector("article")!;

let selected: string | undefined;

d3.selectAll("rect")
    .on("mouseover", (e) => {
        tooltip
            .style("opacity", 1)
            .html(`<p>${e.target.dataset.word} used ${e.target.dataset.value} times</p>`)
            .style("left", e.pageX + "px")
            .style("top", e.pageY - 25 + "px");
    })
    .on("mousemove", (e) => {
        tooltip.style("left", e.pageX + "px").style("top", e.pageY - 25 + "px");
    })
    .on("mouseout", () => {
        tooltip.style("opacity", 0);
    })
    .on("click", async (e) => {
        if (selected === e.target.dataset.word) {
            selected = undefined;

            article.innerHTML = `<p>click a word</p>`;

            return;
        }

        selected = e.target.dataset.word;

        const embeds = await fetch(
            `api/${e.target.parentNode.parentNode.dataset.name}/${encodeURIComponent(selected!)}.json`
        ).then((res) => res.json());

        article.innerHTML = `<h1>Results for ${selected}:</h1><br />`;

        for (const embed of embeds) {
            article.innerHTML += embed.html;
        }

        //@ts-ignore
        window.twttr.widgets.load();
    })
    .on("dblclick", (e) => {
        navigator.clipboard.writeText(e.target.dataset.word);

        Toastify({
            duration: 2500,
            gravity: "bottom",
            text: "copied",
        }).showToast();
    });
