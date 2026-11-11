/* Embedded by plotly_common.py; all coordinates and metadata stay offline. */
window.installNeuronControls = function (plot, retinotopyColors) {
    "use strict";

    const nodeTraceCount = plot.data.length;
    const baseTraceCount = plot.data.length;
    let currentFrame = null;
    let selectedMode = false;
    let retinotopyMode = false;
    let selectedGroups = [];
    let savedVisibility = null;
    const nodeIndices = Array.from({length: nodeTraceCount}, (_, i) => i);
    const decoded = new WeakMap();
    const superclassHeadings = new WeakSet();

    // Plotly's compact HTML stores numeric arrays as base64 typed arrays.
    function array(values) {
        if (!values || Array.isArray(values) || ArrayBuffer.isView(values)) return values || [];
        if (decoded.has(values)) return decoded.get(values);
        if (!values.bdata) throw new Error("Unrecognized coordinate array.");
        const constructors = {
            f4: Float32Array, f8: Float64Array,
            i1: Int8Array, u1: Uint8Array,
            i2: Int16Array, u2: Uint16Array,
            i4: Int32Array, u4: Uint32Array,
        };
        const constructor = constructors[String(values.dtype).replace(/[<>=|]/g, "")];
        if (!constructor) throw new Error("Unsupported coordinate dtype: " + values.dtype);
        const binary = atob(values.bdata);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const result = new constructor(bytes.buffer);
        decoded.set(values, result);
        return result;
    }

    function copyFrame(frame) {
        return {
            ...frame,
            data: (frame.data || []).map(trace => ({...trace})),
            traces: frame.traces ? Array.from(frame.traces) : (frame.data || []).map((_, i) => i),
            layout: frame.layout ? {...frame.layout} : {},
        };
    }
    // Only containers are copied; immutable numeric arrays can be shared.
    const originalFrames = ((plot._transitionData || {})._frames || []).map(copyFrame);
    const framesByName = new Map(originalFrames.map(frame => [String(frame.name), frame]));
    const footerIndex = (plot.layout.annotations || []).length - 1;
    const originalFooter = footerIndex >= 0 ? plot.layout.annotations[footerIndex].text : "";
    const originalLegendTitle = ((plot.layout.legend || {}).title || {}).text || "Cell group";
    const sources = nodeIndices.map(index => {
        const trace = plot.data[index];
        return {
            trace,
            // Plotly mutates trace objects when restyling; retain the original colors.
            color: Array.isArray(trace.marker.color) || ArrayBuffer.isView(trace.marker.color)
                ? Array.from(trace.marker.color) : trace.marker.color,
            positions: {x: trace.x, y: trace.y, z: trace.z},
            types: array(trace.hovertext),
            metadata: array(trace.customdata),
        };
    });
    const types = new Map();
    const families = new Map();
    const normalize = value => String(value).trim().toLowerCase();

    function addMember(index, key, label, member) {
        if (!key) return;
        if (!index.has(key)) index.set(key, {label, members: []});
        index.get(key).members.push(member);
    }
    sources.forEach((source, trace) => {
        source.types.forEach((type, point) => {
            const member = {trace, point};
            addMember(types, normalize(type), String(type), member);
            const metadata = source.metadata[point] || [];
            const family = String(metadata[1] || "");
            const alias = family.replace(/\s+neuron$/i, "");
            addMember(families, normalize(family), alias, member);
            if (normalize(alias) !== normalize(family)) addMember(families, normalize(alias), alias, member);
        });
    });

    const panel = document.createElement("section");
    panel.className = "optic-lobe-type-controls";
    panel.style.cssText = "margin:12px 24px 0;padding:12px 16px;border:1px solid #d9dfe5;border-radius:6px;background:#f7f9fb;font:14px system-ui,sans-serif;";
    const label = document.createElement("label");
    label.textContent = "Show cell types";
    label.style.cssText = "display:block;font-weight:600;margin-bottom:6px;";
    const input = document.createElement("textarea");
    input.id = plot.id + "-cell-types";
    input.rows = 2;
    input.value = "R7, T4";
    input.setAttribute("aria-label", "Cell types, separated by commas or spaces");
    input.style.cssText = "width:min(100%,420px);vertical-align:middle;resize:vertical;font:inherit;padding:6px;border:1px solid #aab5bf;border-radius:4px;";
    label.htmlFor = input.id;
    const showButton = document.createElement("button");
    showButton.type = "button";
    showButton.textContent = "Show types";
    const originalButton = document.createElement("button");
    originalButton.type = "button";
    originalButton.textContent = "Original groups";
    for (const button of [showButton, originalButton]) {
        button.style.cssText = "margin:5px 0 5px 10px;padding:7px 10px;font:inherit;cursor:pointer;";
    }
    const hint = document.createElement("div");
    hint.textContent = "Separate types with commas or spaces. Colors are random for each selection.";
    hint.style.cssText = "font-size:12px;color:#536270;margin-top:6px;";
    const colorLabel = document.createElement("label");
    colorLabel.style.cssText = "display:block;margin-top:10px;cursor:pointer;";
    const retinotopyToggle = document.createElement("input");
    retinotopyToggle.type = "checkbox";
    retinotopyToggle.id = plot.id + "-retinotopy";
    retinotopyToggle.style.cssText = "margin-right:6px;vertical-align:middle;";
    colorLabel.append(retinotopyToggle, document.createTextNode("Retinotopy colors"));
    const colorHint = document.createElement("div");
    const assignedCount = retinotopyColors.reduce((total, colors) => total + colors.filter(color => color !== "#888888").length, 0);
    colorHint.textContent = (assignedCount
        ? assignedCount.toLocaleString() + " cells have column assignments. Angle sets hue; radius sets saturation. Unassigned cells are gray."
        : "No column assignments embedded; cells will be gray.");
    colorHint.style.cssText = "font-size:12px;color:#536270;margin-top:4px;";
    const copyHint = document.createElement("div");
    copyHint.textContent = "Click a neuron to copy its root ID.";
    copyHint.style.cssText = "font-size:12px;color:#536270;margin-top:6px;";
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.cssText = "font-size:12px;line-height:1.5;margin-top:6px;";
    status.textContent = "";
    panel.append(label, input, showButton, originalButton, hint, colorLabel, colorHint, status);
    plot.parentNode.insertBefore(panel, plot);

    async function copyText(text) {
        try {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return;
            }
        } catch (_) {
            // Local HTML pages may not have access to the modern clipboard API.
        }
        const previousFocus = document.activeElement;
        const temporary = document.createElement("textarea");
        temporary.value = text;
        temporary.setAttribute("readonly", "");
        temporary.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
        document.body.appendChild(temporary);
        try {
            temporary.focus();
            temporary.select();
            temporary.setSelectionRange(0, text.length);
            if (!document.execCommand("copy")) throw new Error("Clipboard copy failed.");
        } finally {
            temporary.remove();
            if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
        }
    }

    plot.on("plotly_click", async event => {
        const point = (event.points || []).find(point => (
            ((point.data || {}).type || (point.fullData || {}).type) === "scatter3d"
        ));
        if (!point) return;
        const trace = point.data || point.fullData || {};
        const metadata = point.customdata || array(trace.customdata)[point.pointNumber];
        if (!metadata || metadata[0] === undefined || metadata[0] === null) return;
        // Root IDs are strings; converting through Number would lose large-ID digits.
        const rootId = String(metadata[0]);
        try {
            await copyText(rootId);
            status.textContent = "Copied root ID: " + rootId;
        } catch (_) {
            status.textContent = "Could not copy root ID: " + rootId;
        }
    });

    function squareDistancePlot() {
        const layout = plot._fullLayout || {};
        const size = layout._size;
        const xaxis = layout.xaxis3;
        const yaxis = layout.yaxis3;
        if (!size || !size.w || !xaxis || !yaxis) return;
        // Keep this panel square in pixels without coupling the two data scales.
        const width = Math.min(1, size.h * (yaxis.domain[1] - yaxis.domain[0]) / size.w);
        const domain = [(1 - width) / 2, (1 + width) / 2];
        if (domain.every((value, i) => Math.abs(value - xaxis.domain[i]) < 1e-4)) return;
        Plotly.relayout(plot, {"xaxis3.domain": domain});
    }
    function installSuperclassToggles() {
        if (typeof plot.querySelectorAll !== "function") return;
        for (const row of plot.querySelectorAll(".legend .traces")) {
            const item = (row.__data__ || [])[0];
            if (!item || !item.groupTitle) continue;
            // Plotly's toggleitem mode leaves group headings without handlers.
            row.style.pointerEvents = "all";
            row.style.cursor = "pointer";
            if (superclassHeadings.has(row)) continue;
            superclassHeadings.add(row);
            row.addEventListener("click", async event => {
                const current = (row.__data__ || [])[0];
                if (selectedMode || !current || !current.groupTitle) return;
                event.stopPropagation();
                event.preventDefault();
                const group = current.trace.legendgroup;
                const indices = nodeIndices.filter(index => plot.data[index].legendgroup === group);
                if (!indices.length) return;
                const visible = indices.some(index => plot.data[index].visible === undefined || plot.data[index].visible === true);
                await Plotly.restyle(plot, {visible: visible ? "legendonly" : true}, indices);
            });
        }
    }
    plot.on("plotly_afterplot", () => {
        squareDistancePlot();
        installSuperclassToggles();
    });
    squareDistancePlot();
    installSuperclassToggles();

    plot.on("plotly_animatingframe", event => {
        if (event.name !== null && event.name !== undefined) currentFrame = String(event.name);
    });

    function requestedGroups() {
        const seen = new Set();
        const requests = input.value.split(/[\s,;]+/).filter(Boolean).filter(token => {
            const key = normalize(token);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        const unknown = [];
        const matches = [];
        for (const request of requests) {
            const key = normalize(request);
            const exact = types.has(key);
            const found = exact ? types.get(key) : families.get(key);
            if (found) matches.push({...found, exact});
            else unknown.push(request);
        }
        // Use the same member objects in both indices so overlapping selections
        // can be resolved without copying a second full-cell metadata table.
        const exactMembers = new Set(matches.filter(group => group.exact).flatMap(group => group.members));
        const claimed = new Set();
        const groups = [];
        const hue = Math.random() * 360;
        for (const match of matches) {
            const members = match.members.filter(member => {
                if (claimed.has(member) || (!match.exact && exactMembers.has(member))) return false;
                claimed.add(member);
                return true;
            });
            if (!members.length) continue;
            groups.push({
                label: match.label,
                members,
                color: "hsl(" + ((hue + groups.length * 137.508) % 360).toFixed(2) + ",70%,45%)",
            });
        }
        return {groups, unknown};
    }

    function coordinates(members, frame) {
        const byTrace = new Map();
        if (frame) frame.data.forEach((trace, index) => byTrace.set(frame.traces[index], trace));
        const result = {x: [], y: [], z: []};
        for (const member of members) {
            const positions = byTrace.get(member.trace) || sources[member.trace].positions;
            for (const axis of ["x", "y", "z"]) result[axis].push(array(positions[axis])[member.point]);
        }
        return result;
    }

    function selectedTrace(group, frame) {
        const metadata = group.members.map(member => sources[member.trace].metadata[member.point]);
        const hovertext = group.members.map(member => sources[member.trace].types[member.point]);
        return {
            type: "scatter3d", scene: sources[0].trace.scene || "scene", mode: "markers",
            name: group.label + " (" + group.members.length.toLocaleString("en-US") + ")",
            legendgroup: "selected-" + group.label, showlegend: true,
            marker: {color: groupColor(group), size: 2, line: {width: 0}},
            ...coordinates(group.members, frame), customdata: metadata, hovertext,
            hovertemplate: sources[0].trace.hovertemplate,
        };
    }

    function groupColor(group) {
        return retinotopyMode
            ? group.members.map(member => retinotopyColors[member.trace][member.point])
            : group.color;
    }

    async function pause() {
        if (originalFrames.length) {
            await Plotly.animate(plot, [null], {
                mode: "immediate", frame: {duration: 0, redraw: false}, transition: {duration: 0},
            });
        }
    }

    async function clearFramesAndSelections() {
        const count = ((plot._transitionData || {})._frames || []).length;
        if (count) await Plotly.deleteFrames(plot, Array.from({length: count}, (_, i) => i));
        const extra = Array.from({length: plot.data.length - baseTraceCount}, (_, i) => baseTraceCount + i);
        if (extra.length) await Plotly.deleteTraces(plot, extra);
    }

    function camera() {
        const value = (((plot._fullLayout || {}).scene || {}).camera);
        return value ? JSON.parse(JSON.stringify(value)) : null;
    }

    async function updateLabels(selected, savedCamera) {
        const update = {"legend.title.text": selected ? "Selected cell types" : originalLegendTitle};
        if (footerIndex >= 0) {
            const start = originalFooter.indexOf("Orientation is arbitrary.");
            const rest = start >= 0 ? originalFooter.slice(start) : originalFooter;
            update["annotations[" + footerIndex + "].text"] = retinotopyMode
                ? "Colors: retinotopy (angle = hue, radius = saturation; unassigned cells gray). " + rest
                : selected ? "Colors: selected cell types and families (random colors). " + rest : originalFooter;
        }
        if (savedCamera) update["scene.camera"] = savedCamera;
        await Plotly.relayout(plot, update);
    }

    async function showTypes() {
        const {groups, unknown} = requestedGroups();
        if (!groups.length) {
            status.textContent = unknown.length
                ? "No matches for: " + unknown.join(", ") + ". Current view unchanged."
                : "Enter at least one cell type. Current view unchanged.";
            return;
        }
        await pause();
        const savedCamera = camera();
        if (!selectedMode) savedVisibility = nodeIndices.map(index => plot.data[index].visible === undefined ? true : plot.data[index].visible);
        // If a Plotly call fails midway, Original groups can still restore the view.
        selectedMode = true;
        await clearFramesAndSelections();
        selectedGroups = groups;
        const frame = framesByName.get(String(currentFrame));
        await Plotly.addTraces(plot, groups.map(group => selectedTrace(group, frame)));
        const selectedIndices = groups.map((_, i) => baseTraceCount + i);
        if (originalFrames.length) {
            const frames = originalFrames.map(original => {
                const next = copyFrame(original);
                next.data.push(...groups.map(group => ({type: "scatter3d", ...coordinates(group.members, original)})));
                next.traces.push(...selectedIndices);
                return next;
            });
            await Plotly.addFrames(plot, frames);
        }
        await Plotly.restyle(plot, {visible: false}, nodeIndices);
        await updateLabels(true, savedCamera);
        status.textContent = "Showing " + groups.map(group => group.label + " (" + group.members.length.toLocaleString() + ")").join(", ") + "."
            + (unknown.length ? " Unknown: " + unknown.join(", ") + "." : "");
    }

    async function originalGroups() {
        if (selectedMode) {
            await pause();
            const savedCamera = camera();
            await clearFramesAndSelections();
            if (originalFrames.length) await Plotly.addFrames(plot, originalFrames.map(copyFrame));
            await Plotly.restyle(plot, {visible: savedVisibility}, nodeIndices);
            selectedMode = false;
            selectedGroups = [];
            await updateLabels(false, savedCamera);
        }
        status.textContent = "Showing the original cell groups.";
    }

    async function changeColors() {
        await pause();
        const savedCamera = camera();
        retinotopyMode = retinotopyToggle.checked;
        await Plotly.restyle(plot, {
            "marker.color": sources.map((source, index) => retinotopyMode ? retinotopyColors[index] : source.color),
        }, nodeIndices);
        if (selectedMode) {
            const indices = selectedGroups.map((_, i) => baseTraceCount + i);
            await Plotly.restyle(plot, {"marker.color": selectedGroups.map(groupColor)}, indices);
        }
        // Frames update positions only, so playback retains colors and legend visibility.
        await updateLabels(selectedMode, savedCamera);
    }

    async function run(action) {
        for (const control of [input, showButton, originalButton, retinotopyToggle]) control.disabled = true;
        try {
            await action();
        } catch (error) {
            status.textContent = "Could not update the view: " + error.message;
            console.error(error);
        } finally {
            for (const control of [input, showButton, originalButton, retinotopyToggle]) control.disabled = false;
        }
    }
    showButton.addEventListener("click", () => run(showTypes));
    originalButton.addEventListener("click", () => run(originalGroups));
    retinotopyToggle.addEventListener("change", () => run(changeColors));
};
