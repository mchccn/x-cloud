const user = "kkelsny";

const DATA = WORD_DATA[user];

const values = [...Object.values(DATA)];
const min = Math.min(...values);
const max = Math.max(...values);

const layout = d3
    .cloud()
    .size([900, 900])
    .words(Object.entries(DATA).map(([text, size]) => ({ text, size })))
    .padding(5)
    .rotate(0)
    .font("Impact")
    .fontSize(function (d) {
        return d.size * 10;
    })
    .on("end", draw);

layout.start();

function draw(words) {
    d3.select("section")
        .append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", function (d) {
            return d.size + "px";
        })
        .style("fill", function (d) {
            return ["#0D00A4", "#22007C", "#140152", "#04052E", "#02010A"][Math.floor(Math.random() * 5)];
        })
        .style("font-family", "Impact")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function (d) {
            return d.text;
        });
}
