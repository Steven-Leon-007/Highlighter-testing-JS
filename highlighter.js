// Lets try with library, because make a vanilla implementation could be worse
let defaultHighlights = [];
let highlighter = null;
let colorButtonKeeper = "";
const colorPicker = document.querySelector("#colors-container");

function renderHighlights(colorSelected, onHighlightArray, allHighlights, isFromBrushButton = false) {
    if (highlighter && !isFromBrushButton) {
        highlighter.removeHighlights();
    }

    highlighter = Highlighter(document.getElementById("some-content"), colorSelected);

    colorButtonKeeper = colorSelected;
    if (colorSelected === "turn-transparent") {
        transparentHighlights();
    }

    else {
        highlighter.renderHighlights(onHighlightArray);

        if (colorSelected === "delete-highlight") {
            for (const highlight of defaultHighlights) {
                renderHighlights(highlight.highlightColor, [highlight], defaultHighlights, true);
                colorButtonKeeper = "delete-highlight";
            }
        }

        highlighter.onHighlight((highlight) => {
            if (colorSelected === "delete-highlight") {
                for (const findForHighlight of defaultHighlights) {
                    if (findForHighlight.start === highlight.start && findForHighlight.end === highlight.end) {
                        const indexToDelete = defaultHighlights.findIndex(obj => obj.start === highlight.start);
                        defaultHighlights.splice(indexToDelete, 1);
                        transparentHighlights();
                        reClickTransparent();
                    }
                    else if (highlight.start >= findForHighlight.start && highlight.end <= findForHighlight.end) {
                        const indexToDelete = defaultHighlights.findIndex(obj => highlight.start >= obj.start && highlight.end <= obj.end);
                        defaultHighlights.splice(indexToDelete, 1);
                        transparentHighlights();
                        reClickTransparent();
                    }
                }
            }
            else {
                highlight.highlightColor = colorSelected;
                highlighter.renderHighlights(highlight);
            }
            allHighlights.push(highlight);
        }, colorSelected);
    }
}

function transparentHighlights() {
    const highlightedElements = document.querySelectorAll('[class*="color"]');
    highlightedElements.forEach(el => {
        const parent = el.parentNode;
        const textNode = document.createTextNode(el.textContent);
        parent.replaceChild(textNode, el);
    });
}

const clickTransparent = document.querySelector(".hide li:nth-child(6) button");
clickTransparent.addEventListener("click", () => {
    // Do nothing, just handle the click event
  });

function reClickTransparent() {
    clickTransparent.click();
}

colorPicker.addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON") {
        // Remove border style from all buttons
        const buttons = document.querySelectorAll("#colors-container button");
        buttons.forEach((button) => {
            button.style.border = "";
        });

        // Set border style on clicked button
        event.target.style.border = "1px solid #000";

        const color = event.target.dataset.color;
        let onlyDisplayColors = [];
        switch (color) {
            case "blue-color":
                onlyDisplayColors = defaultHighlights.filter(
                    (hl) => hl.highlightColor === "blue-color"
                );
                renderHighlights("blue-color", onlyDisplayColors, defaultHighlights);
                break;
            case "yellow-color":
                onlyDisplayColors = defaultHighlights.filter(
                    (hl) => hl.highlightColor === "yellow-color"
                );
                renderHighlights("yellow-color", onlyDisplayColors, defaultHighlights);
                break;
            case "green-color":
                onlyDisplayColors = defaultHighlights.filter(
                    (hl) => hl.highlightColor === "green-color"
                );
                renderHighlights("green-color", onlyDisplayColors, defaultHighlights);
                break;
            case "orange-color":
                onlyDisplayColors = defaultHighlights.filter(
                    (hl) => hl.highlightColor === "orange-color"
                );
                renderHighlights("orange-color", onlyDisplayColors, defaultHighlights);
                break;
            case "red-color":
                onlyDisplayColors = defaultHighlights.filter(
                    (hl) => hl.highlightColor === "red-color"
                );
                renderHighlights("red-color", onlyDisplayColors, defaultHighlights);
                break;
            case "turn-transparent":
                renderHighlights("turn-transparent", [], defaultHighlights);
                break;
            case "delete-highlight":
                renderHighlights("delete-highlight", [], defaultHighlights);
            default:
                break;
        }
    }
});

const highlighterContainer = document.querySelector(".highlighter-container");

highlighterContainer.addEventListener("click", (event) => {
    if (
        event.target.classList.contains("brush-button") ||
        event.target.closest(".brush-button")
    ) {
        brushButton();
    }
});

function brushButton() {
    // Render all remaining highlights
    for (const highlight of defaultHighlights) {
        renderHighlights(highlight.highlightColor, [highlight], defaultHighlights, true);
    }
}


function Highlighter(paperEl, highlightClass = "is-highlighted") {

    function generateTree(node, idx = 0) {
        let state = {
            el: node,
            index: idx,
            text: false,
            size: 0,
            children: []
        };
        const kids = Array.from(node.childNodes);
        if (kids.length > 0) {
            let idxRoll = idx;
            let sizeRoll = 0;
            for (let k = 0; k < kids.length; k++) {
                let data = generateTree(kids[k], idxRoll);
                state.children.push(data);
                sizeRoll += data.size;
                idxRoll += data.size;
            }
            state.size = sizeRoll;
        } else {
            state.index = idx;
            state.text = node.textContent;
            state.size = node.textContent.length;
            // console.log(state.text, state.size)
        }
        return state;
    }

    function getNodesFromTree(node) {
        // Only leaf nodes hold text
        if (node.text) {
            return [node];
        } else {
            const kids = node.children || [];
            return kids.reduce((res, kid) => {
                getNodesFromTree(kid).forEach((kn) => {
                    res.push(kn);
                });
                return res;
            }, []);
        }
    }

    function getTextFromTree(node) {
        // Only leaf nodes hold text
        if (node.text) {
            return node.text;
        } else {
            const kids = node.children || [];
            return kids.reduce((text, kid) => {
                return text + getTextFromTree(kid);
            }, "");
        }
    }

    function sortHighlights(highlights) {
        return highlights.sort((a, b) => {
            if (a.start === b.start) {
                const sizeA = a.end - a.start;
                const sizeB = b.end - b.start;
                return sizeA - sizeB;
            } else {
                return a.start - b.start;
            }
        });
    }

    function renderHighlights(hl, node, highlights) {
        if (!Array.isArray(highlights)) {
            highlights = [highlights]
        }
        highlights.forEach((h) => { hl.allHighlights.push(h) });
        const tree = generateTree(node);
        const sortedHighlights = sortHighlights(highlights);
        recursiveRender(tree, sortedHighlights);
    }

    function recursiveRender(node, highlights) {
        if (node.text) {
            const trimmed = node.text.trim();
            if (trimmed.length === 0) {
                return;
            }
            // I might want to draw a span here
            const startIdx = node.index;
            const endIdx = startIdx + node.size;
            const relevant = highlights.filter((h) => {
                // Possible off-by-one errors
                const startsIn = h.start >= startIdx && h.start <= endIdx;
                const endsIn = h.end >= startIdx && h.end <= endIdx;
                const containsIt = h.start < startIdx && h.end > endIdx;
                return startsIn || endsIn || containsIt;
            }).map((h) => {
                // Possible off-by-one errors
                const startNew = Math.max(startIdx, h.start);
                const endNew = Math.min(endIdx, h.end);
                return {
                    start: startNew,
                    end: endNew
                };
            }).sort((a, b) => {
                const sizeA = a.end - a.start;
                const sizeB = b.end - b.start;
                return sizeB - sizeA;
            });
            if (relevant.length === 0) {
                return;
            }
            const highMap = relevant.reduce((map, h) => {
                if (!(h.start in map)) {
                    map[h.start] = { starts: 0, ends: 0 };
                }
                if (!(h.end in map)) {
                    map[h.end] = { starts: 0, ends: 0 };
                }
                map[h.start].starts++;
                map[h.end].ends++;
                return map;
            }, {});
            let html = ``;
            let i;
            for (i = 0; i <= node.text.length; i++) {
                const site = highMap[startIdx + i] || { starts: 0, ends: 0 };
                if (site.starts > 0 || site.ends > 0) {
                    // console.log(startIdx + i, site);
                }
                for (let ki = 0; ki < site.starts; ki++) {
                    html += `<span class="${highlightClass}">`;
                    // html += `<span class="is-marker">|</span>`;
                }
                for (let ji = 0; ji < site.ends; ji++) {
                    html += `</span>`;
                    // html += `<span class="is-marker">|</span>`;
                }
                if (i < node.text.length) {
                    html += node.text[i];
                }
            }
            // console.log("Finished on index:", startIdx + i)
            const span = document.createElement("span");
            span.innerHTML = html;
            node.el.parentNode.insertBefore(span, node.el);
            node.el.parentNode.removeChild(node.el);
        } else {
            const kids = node.children;
            for (let k = 0; k < kids.length; k++) {
                recursiveRender(kids[k], highlights);
            }
        }
    }

    function getTreeNodeByEl(node, el) {
        if (node.el === el) {
            return node;
        } else {
            if (node.children.length > 0) {
                for (let i = 0; i < node.children.length; i++) {
                    const res = getTreeNodeByEl(node.children[i], el);
                    if (res) {
                        return res;
                    }
                }
            }
        }
        return false;
    }

    function getTreeNodeRangeByEl(node, startEl, endEl) {
        const nodes = getNodesFromTree(node);
        const res = [];
        let searching = false;
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].el === startEl) {
                searching = true;
            }
            if (searching) {
                res.push(nodes[i]);
            }
            if (nodes[i].el === endEl) {
                searching = false;
            }
        }
        return res;
    }

    function captureHighlight(tree) {
        const sel = window.getSelection();
        if (sel.type === "Range") {
            const el = sel.anchorNode;
            const node = getTreeNodeByEl(tree, el);
            if (!node) {
                console.error(node)
            }
            const range = sel.getRangeAt(0);
            if (sel.rangeCount > 1) {
                console.warn(`Range count = ${sel.rangeCount}.`);
            }
            const nodeRange = getTreeNodeRangeByEl(tree, range.startContainer, range.endContainer);
            const text = nodeRange.map((pn, i) => {
                let submsg = pn.text;
                if (i === 0 && i === (nodeRange.length - 1)) {
                    submsg = pn.text.substring(range.startOffset, range.endOffset);
                } else if (i === 0) {
                    submsg = pn.text.substring(range.startOffset);
                } else if (i === (nodeRange.length - 1)) {
                    submsg = pn.text.substring(0, range.endOffset);
                }
                return submsg;
            }).reduce((msg, pn, i) => {
                return msg + pn;
            }, "");
            const start = node.index + sel.anchorOffset;
            const end = start + text.length;
            return {
                el: el,
                start: start,
                end: end,
                text: text,
                timestamp: Date.now()
            };
        }
        return false;
    }

    function shiftHighlights(origText, newText, highlights) {
        const sortedHighlights = sortHighlights(highlights);
        const total = Math.max(origText.length, newText.length);
        let origChar;
        let newChar;
        let origIndex = 0;
        let newIndex = 0;
        for (let i = 0; i < total; i++) {
            if (origIndex >= origText.length || newIndex >= newText.length) {
                break;
            }
            origChar = origText[origIndex];
            newChar = newText[newIndex];
            if (origChar === newChar) {
                origIndex++;
                newIndex++;
            } else {
                origIndex++;
                newIndex++;
                sortedHighlights.forEach((h) => {
                    if (i >= h.start) {
                        h.start--;
                    }
                    if (i <= h.end) {
                        h.end--;
                    }
                });
            }
        }
        return sortedHighlights;
    }

    function removeHighlights(hl, targetEl) {
        hl.allHighlights = [];
        // Array.from(targetEl.querySelectorAll(".is-marker")).forEach((el) => {
        //     el.parentNode.removeChild(el);
        // });
        Array.from(targetEl.querySelectorAll(`.${highlightClass}`)).forEach((el) => {
            const span = document.createElement("span");
            span.textContent = el.textContent;
            el.parentNode.insertBefore(span, el);
            el.parentNode.removeChild(el);
        });
    }

    function removeTooltips() {
        Array.from(document.querySelectorAll(".is-tooltip") || []).forEach((el) => {
            el.parentNode.removeChild(el);
        });
    }

    function onHighlight(targetEl, callback) {
        targetEl.onmouseup = targetEl.onkeyup = (e) => {
            const newTree = generateTree(targetEl);
            const high = captureHighlight(newTree);
            if (high) {
                removeTooltips();
                if (colorButtonKeeper !== "turn-transparent") {
                    const tooltip = document.createElement("div");
                    tooltip.classList.add("is-tooltip");

                    tooltip.classList.add(colorButtonKeeper + "-button");
                    if (colorButtonKeeper !== "delete-highlight") {
                        tooltip.textContent = "Highlight";
                    }
                    else {
                        tooltip.textContent = "Dis-highlight";
                    }
                    tooltip.style.top = `${e.layerY + 20}px`;
                    tooltip.style.left = `${e.layerX - 20}px`;
                    tooltip.addEventListener("click", (e) => {
                        // removeHighlights(paperEl);
                        // renderHighlights(targetEl, [high]);
                        removeTooltips();
                        callback(high);
                    });
                    document.body.appendChild(tooltip);
                }

            }
        }
    }

    let hlState = { allHighlights: [] };

    let hl = {
        renderHighlights: (highlights) => renderHighlights(hlState, paperEl, highlights),
        removeHighlights: () => removeHighlights(hlState, paperEl),
        onHighlight: (callback) => onHighlight(paperEl, callback),
        getHighlights: () => hlState.allHighlights
    };

    return hl;

}