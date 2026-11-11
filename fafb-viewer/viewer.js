/* Static viewer: only the selected model is downloaded and rendered. */
(function () {
  "use strict";

  const element = id => document.getElementById(id);
  const select = element("run");
  const stage = element("plot-stage");
  const host = element("plot-host");
  const tools = element("tools");
  const loading = element("loading");
  const errorPanel = element("error");
  let runs = [];
  let activeRun = null;
  let activePlot = null;
  let requestVersion = 0;
  let controller = null;
  let resizeFrame = null;
  const plotLayouts = new WeakMap();
  const readyPlots = new WeakSet();

  function isNarrowPlot() {
    return stage.clientWidth < 600;
  }

  function legendSettings(desktop, narrow) {
    return narrow ? {
      orientation: "v", x: 0.02, xanchor: "left", y: 0.20, yanchor: "top", maxheight: 0.20,
    } : desktop;
  }

  function adaptPlot(plot) {
    const state = plotLayouts.get(plot);
    const narrow = isNarrowPlot();
    if (!state || narrow === state.narrow) return null;
    // Update only when crossing the breakpoint; a relayout can itself resize
    // the plot, so repeated observer notifications must not trigger a loop.
    state.narrow = narrow;
    const update = {
      "scene.domain.x": narrow ? [0, 1] : state.scene.x,
      "scene.domain.y": narrow ? [0.25, 1] : state.scene.y,
    };
    for (const [key, value] of Object.entries(legendSettings(state.legend, narrow))) {
      update["legend." + key] = value;
    }
    return Plotly.relayout(plot, update);
  }

  function disposePlot(plot) {
    if (!plot) return;
    if (typeof Plotly !== "undefined") Plotly.purge(plot);
    plot.remove();
    if (activePlot === plot) activePlot = null;
  }

  function resizePlot() {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      const plot = activePlot;
      if (!plot || !readyPlots.has(plot)) return;
      const adaptation = adaptPlot(plot);
      Promise.resolve(adaptation).then(() => {
        if (activePlot === plot && readyPlots.has(plot)) return Plotly.Plots.resize(plot);
      }).catch(error => console.error("Could not resize the plot:", error));
    });
  }

  function setBusy(message) {
    element("loading-message").textContent = message;
    stage.setAttribute("aria-busy", "true");
    loading.hidden = false;
    errorPanel.hidden = true;
  }

  function showError(error) {
    loading.hidden = true;
    stage.setAttribute("aria-busy", "false");
    errorPanel.hidden = false;
    element("error-message").textContent = location.protocol === "file:"
      ? "Open this viewer through a web server or upload the folder to your website. Browser security prevents loading the model data directly from a local file."
      : error.message || "The model could not be loaded. Check your connection and try again.";
  }

  function showMetadata(run) {
    select.value = run.id;
    element("model-title").textContent = run.name;
    element("description").textContent = run.description;
    element("cell-count").textContent = Number(run.cells).toLocaleString();
    element("iteration-row").hidden = run.iteration === null || run.iteration === undefined;
    element("iteration").textContent = run.iteration === null || run.iteration === undefined
      ? "—" : Number(run.iteration).toLocaleString();
    element("duration-row").hidden = !run.duration;
    element("duration").textContent = run.duration || "—";
    element("position-label").textContent = run.id === "fafb-anchors"
      ? "Anatomical anchors · µm" : "Final saved coordinates";
    element("source").textContent = run.source;
    element("config").textContent = run.config || "No configuration is available for this model.";
    element("permalink").href = "#" + encodeURIComponent(run.id);
    document.title = run.name;
  }

  async function readModel(response) {
    if (!response.ok) throw new Error("The model data could not be downloaded (HTTP " + response.status + ").");
    const bytes = new Uint8Array(await response.arrayBuffer());
    // Some hosts automatically decompress .gz responses; handle both forms.
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      if (typeof DecompressionStream === "undefined") {
        throw new Error("This browser cannot decompress the model data. Open the page in a current version of Chrome, Edge, Firefox, or Safari.");
      }
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return JSON.parse(await new Response(stream).text());
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  async function loadRun(run) {
    const version = ++requestVersion;
    if (controller) controller.abort();
    controller = new AbortController();
    activeRun = run;
    showMetadata(run);
    setBusy("Loading " + run.name + "…");
    tools.replaceChildren();
    disposePlot(activePlot);
    let plot = null;
    try {
      if (typeof Plotly === "undefined" || typeof installNeuronControls !== "function") {
        throw new Error("The plotting tools are missing. Upload the complete folder, including its assets directory.");
      }
      const response = await fetch(run.url, {signal: controller.signal});
      const model = await readModel(response);
      if (version !== requestVersion) return;
      element("loading-message").textContent = "Drawing " + Number(run.cells).toLocaleString() + " neurons…";
      plot = document.createElement("div");
      plot.id = "neuron-plot-" + version;
      plot.className = "neuron-plot";
      plot.setAttribute("aria-label", run.name + ": interactive 3D neuron scatter plot");
      host.replaceChildren(plot);
      activePlot = plot;
      const layout = {...model.layout, autosize: true};
      delete layout.height;
      delete layout.width;
      const desktopLegend = layout.legend || {};
      const state = {
        narrow: isNarrowPlot(),
        scene: {
          x: [...((layout.scene || {}).domain || {}).x || [0, 1]],
          y: [...((layout.scene || {}).domain || {}).y || [0, 1]],
        },
        legend: {
          orientation: desktopLegend.orientation || "v",
          x: desktopLegend.x === undefined ? 1.02 : desktopLegend.x,
          xanchor: desktopLegend.xanchor || "left",
          y: desktopLegend.y === undefined ? 1 : desktopLegend.y,
          yanchor: desktopLegend.yanchor || "top",
          maxheight: desktopLegend.maxheight === undefined ? null : desktopLegend.maxheight,
        },
      };
      plotLayouts.set(plot, state);
      layout.scene = {...layout.scene, domain: {
        ...((layout.scene || {}).domain),
        x: state.narrow ? [0, 1] : state.scene.x,
        y: state.narrow ? [0.25, 1] : state.scene.y,
      }};
      layout.legend = {...desktopLegend, ...legendSettings(state.legend, state.narrow)};
      await Plotly.newPlot(plot, model.data, layout, {
        responsive: true, scrollZoom: true, displaylogo: false,
        showSendToCloud: false, modeBarButtonsToRemove: ["sendChartToCloud"],
        toImageButtonOptions: {format: "png", filename: run.id, scale: 2},
      });
      if (version !== requestVersion) { disposePlot(plot); return; }
      installNeuronControls(plot, model.retinotopyColors);
      const panel = host.querySelector(".optic-lobe-type-controls");
      if (panel) tools.replaceChildren(panel);
      readyPlots.add(plot);
      loading.hidden = true;
      stage.setAttribute("aria-busy", "false");
      resizePlot();
    } catch (error) {
      if (version !== requestVersion || error.name === "AbortError") return;
      disposePlot(plot);
      showError(error);
    }
  }

  function runFromHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); }
    catch (_) { id = ""; }
    return runs.find(run => run.id === id) || runs[0];
  }

  async function initialize() {
    setBusy("Loading models…");
    try {
      const response = await fetch("manifest.json");
      if (!response.ok) throw new Error("The model index could not be downloaded (HTTP " + response.status + ").");
      const manifest = await response.json();
      runs = manifest.runs;
      if (!Array.isArray(runs) || !runs.length) throw new Error("There are no models in this viewer's index.");
      select.replaceChildren(...runs.map(run => {
        const option = document.createElement("option");
        option.value = run.id;
        option.textContent = run.name;
        return option;
      }));
      select.disabled = false;
      if (window.matchMedia("(max-width: 700px)").matches) element("view-tools").open = false;
      await loadRun(runFromHash());
    } catch (error) { showError(error); }
  }

  select.addEventListener("change", () => {
    location.hash = encodeURIComponent(select.value);
  });
  window.addEventListener("hashchange", () => {
    if (!runs.length) return;
    const run = runFromHash();
    if (!activeRun || activeRun.id !== run.id) loadRun(run);
  });
  element("retry").addEventListener("click", () => activeRun ? loadRun(activeRun) : initialize());
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(resizePlot).observe(stage);
  window.addEventListener("resize", resizePlot);
  initialize();
}());
