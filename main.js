import { createWasmMemory, spawnOpenSCAD } from './openscad-runner.js'
// import OpenScad from "./openscad.js";
import { registerOpenSCADLanguage } from './openscad-editor-config.js'
import { writeStateInFragment, readStateFromFragment} from './state.js'
import { buildFeatureCheckboxes } from './features.js';

// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${titles[type] || titles.info}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

const editorElement = document.getElementById('monacoEditor');
const runButton = document.getElementById('run');
const killButton = document.getElementById('kill');
const metaElement = document.getElementById('meta');
const linkContainerElement = document.getElementById('link-container');
const scadContainerElement = document.getElementById('scad-container');//ssouders
const autorenderCheckbox = document.getElementById('autorender');
const autoparseCheckbox = document.getElementById('autoparse');
const autorotateCheckbox = document.getElementById('autorotate');
const showEdgesCheckbox = document.getElementById('showedges'); //ssouders
// const showedgesCheckbox = document.getElementById('showedges');
const showExperimentalFeaturesCheckbox = document.getElementById('show-experimental');
const stlViewerElement = document.getElementById("viewer");
const stlColor = document.getElementById("stlColorValue"); //ssouders
const resetCamera = document.getElementById("resetCam"); //ssouders
const logsElement = document.getElementById("logs");
const featuresContainer = document.getElementById("features");
const flipModeButton = document.getElementById("flip-mode");
// Save/Screenshot buttons removed - handled by platform adapter
const enableGridCheckbox = document.getElementById("enableGrid"); //ssouders
const centerModelCheckbox = document.getElementById("centerModel"); //ssouders
const wordWrapCheckbox = document.getElementById("wordWrap"); //ssouders
const stlOpacity = document.getElementById("stlopacity"); //ssouders
// const maximumMegabytesInput = document.getElementById("maximum-megabytes");
// const copyLinkButton = document.getElementById("copy-link");


const featureCheckboxes = {};

var persistCameraState = false; // If one gets too far, it's really hard to auto reset and can be confusing to users. Just restart.
var stlViewer;
var stlFile;

// if (copyLinkButton) {
//   copyLinkButton.onclick = async () => {
//     const result = await navigator.permissions.query({name: "clipboard-write"});
//     if (result.state == "granted" || result.state == "prompt") {
//       try {
//         // const serviceUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(location.href)}`;
//         // const serviceUrl = 'https://is.gd/create.php?format=simple&url=https://www.example.com';
//         const fetchUrl = '/shorten?url=' + encodeURIComponent(location.href);
//         const url = await (await fetch(fetchUrl)).text();
//         console.log('url', url)
//         navigator.clipboard.writeText(url);
//       } catch (e) {
//         console.error("Failed to create the url", e);
//       }
//     }
//   };
// }

let gridEnable = true;
enableGridCheckbox.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    gridEnable = true;
const axesHelper = new THREE.AxesHelper( 26 );
axesHelper.name = "GridHelper"
  var colors = axesHelper.geometry.attributes.color;

  colors.setXYZ(0, 1, 0, 0);
  colors.setXYZ(1, 1, 0, 0);
  colors.setXYZ(2, 0, 0, 1);
  colors.setXYZ(3, 0, 0, 1);
  colors.setXYZ(4, 0, 1, 0);
  colors.setXYZ(5, 0, 1, 0);

stlViewer.scene.add( axesHelper );

  } else {
    gridEnable = false;
stlViewer.scene.remove(stlViewer.scene.getObjectByName("GridHelper"));
  }
})

  stlColor.oninput = () => {
    stlViewer.set_color(1, stlColor.value);
  }

  stlOpacity.oninput = () => {
    stlViewer.set_opacity(1, stlOpacity.value);
  }

  showEdgesCheckbox.onchange = () => {
    if (showEdgesCheckbox.checked == true) {
        stlViewer.set_edges(1, true);
    } else {
        stlViewer.set_edges(1, false);
    }
  }


  enableGridCheckbox.onchange = () => {
    if (enableGridCheckbox.checked == true) {

//console.log(stlViewer.get_model_info(1));

let modelX = parseInt(stlViewer.get_model_info(1).dims.x) * 2;
if (modelX < 50) {
    modelX = 50;
}

let modelY = parseInt(stlViewer.get_model_info(1).dims.y) * 2;
if (modelY > modelX) {
    modelX = modelY;
}

    stlViewer.set_grid(true,modelX,modelX);
    gridEnable = true;
const axesHelper = new THREE.AxesHelper( (modelX / 2) + 1 );
axesHelper.name = "GridHelper"
  var colors = axesHelper.geometry.attributes.color;

  colors.setXYZ(0, 1, 0, 0);
  colors.setXYZ(1, 1, 0, 0);
  colors.setXYZ(2, 0, 0, 1);
  colors.setXYZ(3, 0, 0, 1);
  colors.setXYZ(4, 0, 1, 0);
  colors.setXYZ(5, 0, 1, 0);

stlViewer.scene.add( axesHelper );

    } else {

let modelX = parseInt(stlViewer.get_model_info(1).dims.x) * 2;
if (modelX < 50) {
    modelX == 50;
}

let modelY = parseInt(stlViewer.get_model_info(1).dims.y) * 2;
if (modelY < 50) {
    modelY == 50;
}

        stlViewer.set_grid(false,modelX,modelX);
    gridEnable = false;
stlViewer.scene.remove(stlViewer.scene.getObjectByName("GridHelper"));

    }
  }


//ssouders this whole function
function buildStlViewer() {
  const stlViewer = new StlViewer(stlViewerElement);
  // const initialCameraState = stlViewer.get_camera_state();
  stlViewer.model_loaded_callback = id => {
    //console.log(stlViewer.renderer.domElement.toDataURL("image/png"));
//console.log(stlViewer.renderer.domElement);
    //stlViewer.set_color(id, '#f9d72c');
    //stlViewer.set_color(id, '#5cff59'); //ssouders
    //stlViewer.set_center_models(true);

    stlViewer.set_color(id, stlColor.value); //ssouders
    console.log('Model loaded callback - Center Model checkbox is:', centerModelCheckbox.checked);
    stlViewer.set_center_models(centerModelCheckbox.checked);
    stlViewer.set_auto_zoom(true);
    stlViewer.set_auto_resize(true);
    stlViewer.rotate(id, -1.5708, 0, 0);

let modelX = parseInt(stlViewer.get_model_info(1).dims.x) * 2;
if (modelX < 50) {
    modelX = 50;
}

let modelY = parseInt(stlViewer.get_model_info(1).dims.y) * 2;
if (modelY > modelX) {
    modelX = modelY;
}

//console.log(modelX + ", " + modelY);

if (parseInt(stlViewer.get_model_info(1).dims.y) >=1000 || parseInt(stlViewer.get_model_info(1).dims.x) >=1000) {
    stlViewer.set_grid(gridEnable,modelX,modelX/100);
} else if (parseInt(stlViewer.get_model_info(1).dims.y) >=100 || parseInt(stlViewer.get_model_info(1).dims.x) >=100) {
    stlViewer.set_grid(gridEnable,modelX,modelX/10);
} else {
    stlViewer.set_grid(gridEnable,modelX,modelX);
}

const axesHelper = new THREE.AxesHelper( (modelX / 2) + 1 );
const color5 = new THREE.Color( 'skyblue' );
axesHelper.name = "GridHelper";

  var colors = axesHelper.geometry.attributes.color;

  colors.setXYZ(0, 1, 0, 0);
  colors.setXYZ(1, 1, 0, 0);
  colors.setXYZ(2, 0, 0, 1);
  colors.setXYZ(3, 0, 0, 1);
  colors.setXYZ(4, 0, 1, 0);
  colors.setXYZ(5, 0, 1, 0);

if (enableGridCheckbox.checked == true) {
    stlViewer.scene.add( axesHelper );
} else {
    gridEnable = false;
stlViewer.scene.remove(stlViewer.scene.getObjectByName("GridHelper"));
  }


    stlViewer.set_opacity(id, stlOpacity.value);
    if (showEdgesCheckbox.checked == true) {
        stlViewer.set_edges(id, true);
    }
    var camera_state = {
        position: {
                    x:0,
                    y:20,
                    z:50
                  },
        up: {
                    x:0,
                    y:1,
                    z:0
                  },
        target: {
                    x:0,
                    y:0,
                    z:0
                  }
    }
if (resetCamera.checked == true) {
    stlViewer.set_camera_state(camera_state);
}
    //console.log(stlViewer.get_camera_state());
    //stlViewer.set_rotation('XYZ');
    // stlViewer.set_auto_rotate(true);
    // stlViewer.set_edges(id, showedgesCheckbox.checked);
    // onStateChanged({allowRun: false});

  };
  return stlViewer;
}


function viewStlFile() {
  try { stlViewer.remove_model(1); } catch (e) {}

  // Set centering preference BEFORE adding model
  stlViewer.set_center_models(centerModelCheckbox.checked);
  console.log('viewStlFile - Setting center_models to:', centerModelCheckbox.checked);

  stlViewer.add_model({ id: 1, local_file: stlFile });
}
// stlViewer.set_auto_zoom(true);

function addDownloadLink(container, blob, fileName) {
  const link = document.createElement('a');
  link.innerText = fileName;
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  container.append(link);
  if (window.onFileExported) {
    window.onFileExported(blob, fileName);
  }
  return link;
}

function addScadLink(container, value, fileName) {
  const link = document.createElement('a');
  link.innerText = fileName;

  // Create blob for download
  const blob = new Blob([value], { type: 'text/plain' });
  link.href = URL.createObjectURL(blob);
  link.download = fileName;

  container.append(link);
  if (window.onFileExported) {
    window.onFileExported(blob, fileName);
  }
  return link;
}

function formatMillis(n) {
  if (n < 1000) {
    return `${Math.floor(n / 1000)} sec`;
  }
  return `${Math.floor(n / 100) / 10} sec`;
}

let lastJob;

killButton.onclick = () => {
  if (lastJob) {
    lastJob.kill();
    lastJob = null;
  }
};

function setAutoRotate(value) {
  autorotateCheckbox.checked = value;
  stlViewer.set_auto_rotate(value);
}

function setViewerFocused(value) {
  if (value) {
    flipModeButton.innerText = 'Edit ✍️';
    stlViewerElement.classList.add('focused');
  } else {
    flipModeButton.innerText = 'Interact 🤏';
    stlViewerElement.classList.remove('focused');
  }
}
function isViewerFocused() {
  return stlViewerElement.classList.contains('focused');
}

function setExecuting(v) {
  killButton.disabled = !v;
}

var lastProcessedOutputsTimestamp;

function processMergedOutputs(editor, mergedOutputs, timestamp) {
  if (lastProcessedOutputsTimestamp != null && timestamp < lastProcessedOutputsTimestamp) {
    // We have slow (render) and fast (syntax check) runs running concurrently.
    // The results of slow runs might be out of date now.
    return;
  }
  lastProcessedOutputsTimestamp = timestamp;

  let unmatchedLines = [];
  let allLines = [];

  const markers = [];
  let warningCount = 0, errorCount = 0;
  const addError = (error, file, line) => {
    markers.push({
      startLineNumber: Number(line),
      startColumn: 1,
      endLineNumber: Number(line),
      endColumn: 1000,
      message: error,
      severity: monaco.MarkerSeverity.Error
    })
  }
  for (const {stderr, stdout, error} of mergedOutputs){
    allLines.push(stderr ?? stdout ?? `EXCEPTION: ${error}`);
    if (stderr) {
      if (stderr.startsWith('ERROR:')) errorCount++;
      if (stderr.startsWith('WARNING:')) warningCount++;

      let m = /^ERROR: Parser error in file "([^"]+)", line (\d+): (.*)$/.exec(stderr)
      if (m) {
        const [_, file, line, error] = m
        addError(error, file, line);
        continue;
      }

      m = /^ERROR: Parser error: (.*?) in file ([^",]+), line (\d+)$/.exec(stderr)
      if (m) {
        const [_, error, file, line] = m
        addError(error, file, line);
        continue;
      }

      m = /^WARNING: (.*?),? in file ([^,]+), line (\d+)\.?/.exec(stderr);
      if (m) {
        const [_, warning, file, line] = m
        markers.push({
          startLineNumber: Number(line),
          startColumn: 1,
          endLineNumber: Number(line),
          endColumn: 1000,
          message: warning,
          severity: monaco.MarkerSeverity.Warning
        })
        continue;
      }
    }
    unmatchedLines.push(stderr ?? stdout ?? `EXCEPTION: ${error}`);
  }
  if (errorCount || warningCount) unmatchedLines = [`${errorCount} errors, ${warningCount} warnings!`, '', ...unmatchedLines];

  logsElement.innerText = allLines.join("\n")
  // logsElement.innerText = unmatchedLines.join("\n")
  
  monaco.editor.setModelMarkers(editor.getModel(), 'openscad', markers);
}

const syntaxDelay = 300;
const checkSyntax = turnIntoDelayableExecution(syntaxDelay, () => {
  const source = editor.getValue();
  const timestamp = Date.now();

  const job = spawnOpenSCAD({
    inputs: [['input.scad', source + '\n']],
    args: ["input.scad", "-o", "out.ast"],
  });

  return {
    kill: () => job.kill(),
    completion: (async () => {
      try {
        const result = await job;
        console.log(result);
        processMergedOutputs(editor, result.mergedOutputs, timestamp);
      } catch (e) {
        console.error(e);
      }
    })()
  };
});

var sourceFileName;
var editor;

function turnIntoDelayableExecution(delay, createJob) {
  var pendingId;
  var runningJobKillSignal;

  const doExecute = async () => {
    if (runningJobKillSignal) {
      runningJobKillSignal();
      runningJobKillSignal = null;
    }
    const {kill, completion} = createJob();
    runningJobKillSignal = kill;
    try {
      await completion;
    } finally {
      runningJobKillSignal = null;
    }
  }
  return async ({now}) => {
    if (pendingId) {
      clearTimeout(pendingId);
      pendingId = null;
    }
    if (now) {
      doExecute();
    } else {
      pendingId = setTimeout(doExecute, delay);
    }
  };
}

var renderDelay = 1000;
const render = turnIntoDelayableExecution(renderDelay, () => {
  const source = editor.getValue();
//console.log(source);
  scadContainerElement.innerHTML = '';
  addScadLink(scadContainerElement, source, 'export.scad'); //ssouders

  const timestamp = Date.now();
  metaElement.innerText = 'rendering...';
  metaElement.title = null;
  runButton.disabled = true;
  setExecuting(true);
  
  const job = spawnOpenSCAD({
    // wasmMemory,
    inputs: [['input.scad', source]],
    args: [
      "input.scad",
      "-o", "export.stl", //ssouders
      "--export-format=binstl",
      ...Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked).map(f => `--enable=${f}`),
    ],
    outputPaths: ['export.stl'] //souders
  });

  return {
    kill: () => job.kill(),
    completion: (async () => {
      try {
        const result = await job;
        console.log(result);
        processMergedOutputs(editor, result.mergedOutputs, timestamp);
  
        if (result.error) {
          throw result.error;
        }
  
        metaElement.innerText = formatMillis(result.elapsedMillis);
        
        const [output] = result.outputs;
        if (!output) throw 'No output from runner!'
        const [filePath, content] = output;
        const filePathFragments = filePath.split('/');
        const fileName = filePathFragments[filePathFragments.length - 1];

        // TODO: have the runner accept and return files.
        const blob = new Blob([content], { type: "application/octet-stream" });
        // console.log(new TextDecoder().decode(content));
        stlFile = new File([blob], fileName);

        viewStlFile(stlFile);

        linkContainerElement.innerHTML = '';
        addDownloadLink(linkContainerElement, blob, fileName);
      } catch (e) {
        console.error(e, e.stack);
        metaElement.innerText = '<failed>';
        metaElement.title = e.toString();
      } finally {
        setExecuting(false);
        runButton.disabled = false;
      }
    })()
  }
});

runButton.onclick = () => render({now: true});

function getState() {
  const features = Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked);
  return {
    source: {
      name: sourceFileName,
      content: editor.getValue(),
    },
    //autorender: autorenderCheckbox.checked, //ssouders
	enablegrid: enableGridCheckbox.checked, //ssouders
    autoparse: autoparseCheckbox.checked,
    //autorotate: autorotateCheckbox.checked,
    // showedges: showedgesCheckbox.checked,
    // maximumMegabytes: Number(maximumMegabytesInput.value),
    features,
    viewerFocused: isViewerFocused(),
    // showExp: features.length > 0 || showExperimentalFeaturesCheckbox.checked,
    showExp: showExperimentalFeaturesCheckbox.checked,
    camera: persistCameraState ? stlViewer.get_camera_state() : null,
  };
}

function normalizeSource(src) {
  return src.replaceAll(/\/\*.*?\*\/|\/\/.*?$/gm, '')
    .replaceAll(/([,.({])\s+/gm, '$1')
    .replaceAll(/\s+([,.({])/gm, '$1')
    .replaceAll(/\s+/gm, ' ')
    .trim()
}
function normalizeStateForCompilation(state) {
  return {
    ...state,
    source: {
      ...state.source,
      content: normalizeSource(state.source.content)
    },
  }
}

const defaultState = {
  source: {
    name: 'input.stl',
/*
    content: `translate([-50, 0, 50])
  linear_extrude(10)
    text("hello world!");
        
cube(40, center=true);
translate([10, 10, 10])
  cube(40, center=true);
  
// This demo includes many libraries:
//
// include <BOSL2/std.scad>
// spheroid(d=100, style="icosa", $fn=20);
`
*/
	content: ''
  },
  maximumMegabytes: 1024,
  viewerFocused: false,
  // maximumMegabytes: 512,
  features: ['manifold', 'fast-csg', 'fast-csg-trust-corefinement', 'fast-csg-remesh', 'fast-csg-exact-callbacks', 'lazy-union'],
};

// var wasmMemory;
// var lastMaximumMegabytes;
// function setMaximumMegabytes(maximumMegabytes) {
//   if (!wasmMemory || (lastMaximumMegabytes != maximumMegabytes)) {
//     wasmMemory = createWasmMemory({maximumMegabytes});
//     lastMaximumMegabytes = maximumMegabytes;
//   }
// }

function updateExperimentalCheckbox(temptativeChecked) {
  const features = Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked);
  const hasFeatures = features.length > 0;
  // showExperimentalFeaturesCheckbox.checked = hasFeatures || (temptativeChecked ?? showExperimentalFeaturesCheckbox.checked);
  // showExperimentalFeaturesCheckbox.disabled = hasFeatures;
}

function setState(state) {
  editor.setValue(state.source.content);
  sourceFileName = state.source.name || 'input.scad';
  if (state.camera && persistCameraState) {
    stlViewer.set_camera_state(state.camera);
  }
  let features = new Set();
  if (state.features) {
    features = new Set(state.features);
    Object.keys(featureCheckboxes).forEach(f => featureCheckboxes[f].checked = features.has(f));
  }
  //autorenderCheckbox.checked = state.autorender ?? true; //ssouders
  autoparseCheckbox.checked = state.autoparse ?? true;
  
  // stlViewer.set_edges(1, showedgesCheckbox.checked = state.showedges ?? false);

  //setAutoRotate(state.autorotate ?? true) //ssouders
  setViewerFocused(state.viewerFocused ?? false);
  updateExperimentalCheckbox(state.showExp ?? false);

  // const maximumMegabytes = state.maximumMegabytes ?? defaultState.maximumMegabytes;
  // setMaximumMegabytes(maximumMegabytes);
  // maximumMegabytesInput.value = maximumMegabytes;
}

var previousNormalizedState;
function onStateChanged({allowRun}) {
  const newState = getState();
  writeStateInFragment(newState);

  featuresContainer.style.display = showExperimentalFeaturesCheckbox.checked ? null : 'none';

  const normalizedState = normalizeStateForCompilation(newState);
  if (JSON.stringify(previousNormalizedState) != JSON.stringify(normalizedState)) {
    previousNormalizedState = normalizedState;
    
    if (allowRun) {
      if (autoparseCheckbox.checked) {
        checkSyntax({now: false});
      }
      if (autorenderCheckbox.checked) {
        render({now: false});
      }
    }
  }
}

function pollCameraChanges() {
  if (!persistCameraState) {
    return;
  }
  let lastCam;
  setInterval(function() {
    const ser = JSON.stringify(stlViewer.get_camera_state());
    if (ser != lastCam) {
      lastCam = ser;
      onStateChanged({allowRun: false});
    }
  }, 1000); // TODO only if active tab
}

try {
  const workingDir = '/home';
  const fs = await createEditorFS(workingDir);
  await registerOpenSCADLanguage(fs, workingDir, zipArchives);

  // const readDir = path => new Promise((res, rej) => fs.readdir(path, (err, files) => err ? rej(err) : res(files)));
  // console.log('readDir', '/', await readDir('/'));
  // console.log('readDir', workingDir, await readDir(workingDir));

  editor = monaco.editor.create(editorElement, {
    // value: source,
    theme: 'vs-dark',
    lineNumbers: true,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 13,
    language: 'openscad',
    minimap: { enabled: false },
    padding: { top: 10, bottom: 10 },
    wordWrap: 'on',
  });
  editor.addAction({
    id: "run-openscad",
    label: "Run OpenSCAD",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    run: () => render({now: true}),
  });

  // Apply Center Model preference BEFORE building viewer
  const savedCenterModel = localStorage.getItem('openscad_center_model');
  const centerModelEnabled = savedCenterModel !== null ? savedCenterModel === 'true' : true; // Default to true
  if (centerModelCheckbox) {
    centerModelCheckbox.checked = centerModelEnabled;
    // Force attribute update
    if (centerModelEnabled) {
      centerModelCheckbox.setAttribute('checked', 'checked');
    } else {
      centerModelCheckbox.removeAttribute('checked');
    }
    console.log('Center Model preference loaded:', centerModelEnabled, 'Checkbox state:', centerModelCheckbox.checked);
  }

  stlViewer = buildStlViewer();
  // stlViewerElement.onclick = () => stlViewerElement.focus();
  stlViewerElement.ondblclick = () => {
  // stlViewerElement.onclick = () => {
    console.log("Tap detected!");
    setAutoRotate(!autorotateCheckbox.checked);
    onStateChanged({allowRun: false});
  };
  //   try { stlViewer.remove_model(1); } catch (e) {}
  //   try { stlViewer.dispose(); } catch (e) {}
    
  //   stlViewer = buildStlViewer();
  //   viewStlFile();
  // };
  
  stlViewerElement.onkeydown = e => {
    if (e.key === "Escape" || e.key === "Esc") editor.focus();
  };

  const initialState = readStateFromFragment() || defaultState;
  
  setState(initialState);
  await buildFeatureCheckboxes(featuresContainer, featureCheckboxes, () => {  
    updateExperimentalCheckbox();
    onStateChanged({allowRun: true});
  });
  setState(initialState);
  
  showExperimentalFeaturesCheckbox.onchange = () => onStateChanged({allowRun: false});

  autorenderCheckbox.onchange = () => onStateChanged({allowRun: autorenderCheckbox.checked});
  autoparseCheckbox.onchange = () => onStateChanged({allowRun: autoparseCheckbox.checked});
  autorotateCheckbox.onchange = () => {
    stlViewer.set_auto_rotate(autorotateCheckbox.checked);
    onStateChanged({allowRun: false});
  };
  // showedgesCheckbox.onchange = () => onStateChanged({allowRun: false});

  flipModeButton.onclick = () => {
    const wasViewerFocused = isViewerFocused();
    setViewerFocused(!wasViewerFocused);

    if (!wasViewerFocused) {
      setAutoRotate(false);
    }
    onStateChanged({allowRun: false});
  };
  // maximumMegabytesInput.oninput = () => {
  //   setMaximumMegabytes(Number(maximumMegabytesInput.value));
  //   onStateChanged({allowRun: true});
  // };
  
  editor.focus();

  pollCameraChanges();
  onStateChanged({allowRun: true});

  editor.onDidChangeModelContent(() => {
    onStateChanged({allowRun: true});
  });

  // Panel Resize Functionality
  const editorPanel = document.getElementById('editor-panel');
  const viewPanel = document.getElementById('view-panel');
  const resizeHandle = document.getElementById('editor-resize-handle');

  let isResizing = false;
  let lastPanelWidth = parseInt(localStorage.getItem('openscad_editor_panel_width')) || 30; // Default 30vw

  // Apply saved width on load
  if (lastPanelWidth) {
    editorPanel.style.width = lastPanelWidth + 'vw';
    viewPanel.style.width = (100 - lastPanelWidth) + 'vw';
  }

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeHandle.classList.add('resizing');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const containerWidth = document.querySelector('.root').offsetWidth;
    const newWidth = (e.clientX / containerWidth) * 100;

    // Constrain between 20vw and 60vw
    if (newWidth >= 20 && newWidth <= 60) {
      editorPanel.style.width = newWidth + 'vw';
      viewPanel.style.width = (100 - newWidth) + 'vw';
      lastPanelWidth = newWidth;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      resizeHandle.classList.remove('resizing');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Save to localStorage
      localStorage.setItem('openscad_editor_panel_width', Math.round(lastPanelWidth));
    }
  });

  // Font Size Controls
  const DEFAULT_FONT_SIZE = 13;
  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 24;

  let currentFontSize = parseInt(localStorage.getItem('openscad_font_size')) || DEFAULT_FONT_SIZE;

  // Apply saved font size
  editor.updateOptions({ fontSize: currentFontSize });

  function updateFontSize(newSize) {
    if (newSize >= MIN_FONT_SIZE && newSize <= MAX_FONT_SIZE) {
      currentFontSize = newSize;
      editor.updateOptions({ fontSize: currentFontSize });
      localStorage.setItem('openscad_font_size', currentFontSize);
    }
  }

  // Button handlers
  document.getElementById('increaseFontSize').onclick = () => updateFontSize(currentFontSize + 1);
  document.getElementById('decreaseFontSize').onclick = () => updateFontSize(currentFontSize - 1);
  document.getElementById('resetFontSize').onclick = () => updateFontSize(DEFAULT_FONT_SIZE);

  // Keyboard shortcuts for font size
  editor.addAction({
    id: 'increase-font-size',
    label: 'Increase Font Size',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal], // Ctrl/Cmd + =
    run: () => updateFontSize(currentFontSize + 1)
  });

  editor.addAction({
    id: 'increase-font-size-plus',
    label: 'Increase Font Size (Plus)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Equal], // Ctrl/Cmd + Shift + = (which is +)
    run: () => updateFontSize(currentFontSize + 1)
  });

  editor.addAction({
    id: 'decrease-font-size',
    label: 'Decrease Font Size',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus],
    run: () => updateFontSize(currentFontSize - 1)
  });

  editor.addAction({
    id: 'reset-font-size',
    label: 'Reset Font Size',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0],
    run: () => updateFontSize(DEFAULT_FONT_SIZE)
  });

  // Word Wrap Toggle
  const savedWordWrap = localStorage.getItem('openscad_word_wrap');
  const wordWrapEnabled = savedWordWrap !== null ? savedWordWrap === 'true' : true; // Default to true

  // Apply saved word wrap preference
  editor.updateOptions({ wordWrap: wordWrapEnabled ? 'on' : 'off' });
  if (wordWrapCheckbox) {
    wordWrapCheckbox.checked = wordWrapEnabled;
  }

  // Word wrap checkbox handler
  if (wordWrapCheckbox) {
    wordWrapCheckbox.addEventListener('change', (event) => {
      const isEnabled = event.currentTarget.checked;
      editor.updateOptions({ wordWrap: isEnabled ? 'on' : 'off' });
      localStorage.setItem('openscad_word_wrap', isEnabled);
    });
  }

  // Center model checkbox handler (preference already applied before viewer was built)
  if (centerModelCheckbox) {
    centerModelCheckbox.addEventListener('change', (event) => {
      const isEnabled = event.currentTarget.checked;
      localStorage.setItem('openscad_center_model', isEnabled);
      // Note: This will take effect on the next render
    });
  }

} catch (e) {
  console.error(e);
}

// Platform Integration - serialize/load project data
window.serializeProjectData = function() {
  if (!editor) return null;
  return {
    code: editor.getValue(),
    features: Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked)
  };
};

window.loadProjectData = function(data) {
  if (!editor) return;
  if (data && data.code !== undefined) {
    editor.setValue(data.code);
  }
  if (data && data.features && featureCheckboxes) {
    Object.keys(featureCheckboxes).forEach(f => {
      featureCheckboxes[f].checked = data.features.includes(f);
    });
  }
};

// Make showToast available globally for adapter
window.showToast = showToast;

// Hide loading overlay once editor is actually ready (updateLoadingProgress now defined in index.php)
function hideLoadingScreen() {
  updateLoadingProgress(100, 'Ready!');

  setTimeout(() => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => {
        loadingOverlay.remove();
      }, 500);
    }
  }, 300);
}

// Wait for Monaco Editor and WASM to be ready
let readyCheckCount = 0;
const checkIfReady = setInterval(() => {
  readyCheckCount++;

  // Check if Monaco editor exists and WASM is loaded
  const monacoReady = typeof monaco !== 'undefined';
  const editorReady = editor && editor.getValue !== undefined;

  if (monacoReady && editorReady) {
    hideLoadingScreen();
    clearInterval(checkIfReady);
  } else if (readyCheckCount > 300) {
    // Timeout after 30 seconds
    console.warn('Loading timeout - forcing hide');
    hideLoadingScreen();
    clearInterval(checkIfReady);
  }
}, 100);

// Update opacity value display
const opacitySlider = document.getElementById('stlopacity');
const opacityValue = document.querySelector('.opacity-value');
if (opacitySlider && opacityValue) {
  opacitySlider.addEventListener('input', function() {
    const value = Math.round(this.value * 100);
    opacityValue.textContent = value + '%';
  });
}

// ============================================================================
// OpenSCAD Documentation System
// ============================================================================

const openscadCommands = [
  // 3D Primitives
  {
    name: 'cube',
    category: '3d-primitives',
    syntax: 'cube([width, depth, height], center=false);',
    description: 'Creates a cube or rectangular box. Can be centered at origin or positioned at positive octant.',
    params: '<strong>size:</strong> Single number (cube) or [x, y, z] array (box)<br><strong>center:</strong> true = centered at origin, false = corner at origin (default)',
    example: 'cube([10, 20, 30], center=true);'
  },
  {
    name: 'sphere',
    category: '3d-primitives',
    syntax: 'sphere(r=radius, $fn=resolution);',
    description: 'Creates a sphere centered at the origin.',
    params: '<strong>r:</strong> Radius of the sphere<br><strong>$fn:</strong> Number of fragments (higher = smoother, default based on $fa and $fs)',
    example: 'sphere(r=15, $fn=50);'
  },
  {
    name: 'cylinder',
    category: '3d-primitives',
    syntax: 'cylinder(h=height, r=radius, center=false, $fn=resolution);',
    description: 'Creates a cylinder or cone. Can have different top/bottom radii for cones.',
    params: '<strong>h:</strong> Height of cylinder<br><strong>r:</strong> Radius (or r1/r2 for cone)<br><strong>center:</strong> true = centered on z-axis, false = base at z=0<br><strong>$fn:</strong> Number of sides',
    example: 'cylinder(h=30, r=10, center=true, $fn=100);'
  },
  {
    name: 'polyhedron',
    category: '3d-primitives',
    syntax: 'polyhedron(points=[[x,y,z],...], faces=[[p1,p2,p3],...]);',
    description: 'Creates a polyhedron from a list of points and faces. Advanced users only.',
    params: '<strong>points:</strong> Array of [x,y,z] coordinate arrays<br><strong>faces:</strong> Array of point index arrays (counter-clockwise)',
    example: 'polyhedron(\n  points=[[0,0,0],[10,0,0],[0,10,0],[0,0,10]],\n  faces=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]]\n);'
  },

  // 2D Shapes
  {
    name: 'circle',
    category: '2d-shapes',
    syntax: 'circle(r=radius, $fn=resolution);',
    description: 'Creates a 2D circle. Can be extruded into 3D.',
    params: '<strong>r:</strong> Radius of circle<br><strong>$fn:</strong> Number of fragments for smoothness',
    example: 'circle(r=20, $fn=100);'
  },
  {
    name: 'square',
    category: '2d-shapes',
    syntax: 'square([width, height], center=false);',
    description: 'Creates a 2D rectangle or square.',
    params: '<strong>size:</strong> Single number (square) or [x, y] array<br><strong>center:</strong> true = centered, false = corner at origin',
    example: 'square([30, 20], center=true);'
  },
  {
    name: 'polygon',
    category: '2d-shapes',
    syntax: 'polygon(points=[[x,y],...], paths=[[p1,p2,...]]);',
    description: 'Creates a 2D polygon from points. Can have holes using paths.',
    params: '<strong>points:</strong> Array of [x,y] coordinates<br><strong>paths:</strong> Optional array defining outline and holes',
    example: 'polygon(points=[[0,0],[10,0],[10,10],[0,10]]);'
  },
  {
    name: 'text',
    category: '2d-shapes',
    syntax: 'text("Hello", size=10, font="Liberation Sans");',
    description: 'Creates 2D text that can be extruded.',
    params: '<strong>text:</strong> String to display<br><strong>size:</strong> Font size<br><strong>font:</strong> Font name<br><strong>halign/valign:</strong> Alignment (left/center/right, top/center/baseline/bottom)',
    example: 'linear_extrude(2)\n  text("OpenSCAD", size=12, font="Liberation Sans:style=Bold");'
  },

  // Transformations
  {
    name: 'translate',
    category: 'transformations',
    syntax: 'translate([x, y, z]) { ... }',
    description: 'Moves objects by the specified x, y, z offset.',
    params: '<strong>v:</strong> [x, y, z] translation vector',
    example: 'translate([10, 5, 0])\n  cube(5);'
  },
  {
    name: 'rotate',
    category: 'transformations',
    syntax: 'rotate([x_angle, y_angle, z_angle]) { ... }',
    description: 'Rotates objects around the x, y, and z axes (in degrees).',
    params: '<strong>a:</strong> Single angle for z-axis OR [x, y, z] angles<br><strong>v:</strong> Optional rotation axis vector',
    example: 'rotate([45, 0, 0])\n  cube(10);'
  },
  {
    name: 'scale',
    category: 'transformations',
    syntax: 'scale([x_factor, y_factor, z_factor]) { ... }',
    description: 'Scales objects by the specified factors.',
    params: '<strong>v:</strong> Single number (uniform) or [x, y, z] scale factors',
    example: 'scale([2, 1, 0.5])\n  sphere(10);'
  },
  {
    name: 'mirror',
    category: 'transformations',
    syntax: 'mirror([x, y, z]) { ... }',
    description: 'Mirrors objects across a plane defined by the normal vector.',
    params: '<strong>v:</strong> Normal vector of mirror plane [x, y, z]',
    example: 'mirror([1, 0, 0])\n  cube([10, 20, 30]);'
  },
  {
    name: 'resize',
    category: 'transformations',
    syntax: 'resize([x, y, z], auto=false) { ... }',
    description: 'Resizes objects to exact dimensions, optionally maintaining aspect ratio.',
    params: '<strong>newsize:</strong> [x, y, z] target size<br><strong>auto:</strong> true/false or [x, y, z] for aspect ratio control',
    example: 'resize([20, 20, 20], auto=true)\n  sphere(10);'
  },

  // Boolean Operations
  {
    name: 'union',
    category: 'boolean',
    syntax: 'union() { ... }',
    description: 'Combines multiple objects into one (additive). Default operation.',
    params: 'No parameters - encloses child objects in braces',
    example: 'union() {\n  cube(10);\n  translate([5, 5, 0])\n    sphere(7);\n}'
  },
  {
    name: 'difference',
    category: 'boolean',
    syntax: 'difference() { ... }',
    description: 'Subtracts all subsequent objects from the first object.',
    params: 'First child = positive volume, remaining children = subtracted',
    example: 'difference() {\n  cube(20, center=true);\n  sphere(12, $fn=50);\n}'
  },
  {
    name: 'intersection',
    category: 'boolean',
    syntax: 'intersection() { ... }',
    description: 'Keeps only the overlapping volume of all objects.',
    params: 'All children must overlap to create geometry',
    example: 'intersection() {\n  cube(15, center=true);\n  sphere(10, $fn=50);\n}'
  },
  {
    name: 'hull',
    category: 'boolean',
    syntax: 'hull() { ... }',
    description: 'Creates convex hull around all child objects (shrink-wrap effect).',
    params: 'Wraps all children in minimum convex volume',
    example: 'hull() {\n  translate([0, 0, 0]) sphere(5);\n  translate([20, 20, 20]) sphere(5);\n}'
  },
  {
    name: 'minkowski',
    category: 'boolean',
    syntax: 'minkowski() { ... }',
    description: 'Minkowski sum - adds shapes together with rounded edges.',
    params: 'Combines geometry of all children (computationally expensive)',
    example: 'minkowski() {\n  cube(10);\n  sphere(2, $fn=20);\n}'
  },

  // Extrusion
  {
    name: 'linear_extrude',
    category: 'extrusion',
    syntax: 'linear_extrude(height=h, twist=angle, scale=factor) { ... }',
    description: 'Extrudes 2D shapes into 3D along the z-axis with optional twist and scale.',
    params: '<strong>height:</strong> Extrusion height<br><strong>twist:</strong> Rotation degrees over height<br><strong>scale:</strong> Top vs bottom size<br><strong>slices:</strong> Segments for twist/scale',
    example: 'linear_extrude(height=30, twist=90, scale=0.5, slices=20)\n  circle(10);'
  },
  {
    name: 'rotate_extrude',
    category: 'extrusion',
    syntax: 'rotate_extrude(angle=360, $fn=resolution) { ... }',
    description: 'Rotates 2D shapes around the z-axis to create surfaces of revolution.',
    params: '<strong>angle:</strong> Degrees of rotation (default 360 for full circle)<br><strong>$fn:</strong> Number of segments',
    example: 'rotate_extrude($fn=100)\n  translate([20, 0, 0])\n    circle(5);'
  },

  // Modifiers
  {
    name: 'color',
    category: 'modifiers',
    syntax: 'color("red") { ... } or color([r, g, b, a]) { ... }',
    description: 'Colors objects for preview (does not affect final render/export).',
    params: '<strong>c:</strong> Color name string OR [r, g, b, alpha] values (0-1)',
    example: 'color("blue")\n  sphere(10);\n\ncolor([1, 0.5, 0, 0.7])\n  cube(15);'
  },
  {
    name: 'offset',
    category: 'modifiers',
    syntax: 'offset(r=radius, delta=amount) { ... }',
    description: 'Offsets 2D shapes inward (negative) or outward (positive). Creates rounded/chamfered corners.',
    params: '<strong>r:</strong> Radius (rounded corners)<br><strong>delta:</strong> Offset distance (sharp corners)<br><strong>chamfer:</strong> true for chamfer instead of round',
    example: 'offset(r=3)\n  square(20);'
  },

  // Math Functions
  {
    name: 'for loop',
    category: 'math',
    syntax: 'for (i = [start : increment : end]) { ... }',
    description: 'Repeats operations in a loop. Creates multiple instances of geometry.',
    params: '<strong>i:</strong> Iterator variable<br><strong>start:</strong> Starting value<br><strong>increment:</strong> Step size (optional, default 1)<br><strong>end:</strong> End value',
    example: 'for (i = [0 : 5 : 30]) {\n  translate([i, 0, 0])\n    cube(3);\n}'
  },
  {
    name: 'if statement',
    category: 'math',
    syntax: 'if (condition) { ... } else { ... }',
    description: 'Conditional geometry creation based on boolean expression.',
    params: '<strong>condition:</strong> Boolean expression to evaluate',
    example: 'size = 10;\nif (size > 5) {\n  sphere(size);\n} else {\n  cube(size);\n}'
  },
  {
    name: 'echo',
    category: 'math',
    syntax: 'echo("message", variable);',
    description: 'Prints values to console for debugging.',
    params: 'Any number of comma-separated values to print',
    example: 'radius = 10;\necho("Radius is:", radius);\ncube(radius);'
  },
  {
    name: 'let',
    category: 'math',
    syntax: 'let (var1=value1, var2=value2) { ... }',
    description: 'Creates local variables with scope limited to the block.',
    params: 'Variable assignments as parameters, scope in braces',
    example: 'let (r=10, h=20) {\n  cylinder(r=r, h=h);\n}'
  },
  {
    name: 'Math: sin/cos/tan',
    category: 'math',
    syntax: 'sin(angle), cos(angle), tan(angle)',
    description: 'Trigonometric functions (angles in degrees).',
    params: '<strong>angle:</strong> Angle in degrees',
    example: 'for (i = [0 : 30 : 360]) {\n  translate([20*cos(i), 20*sin(i), 0])\n    sphere(2);\n}'
  },
  {
    name: 'Math: sqrt/pow',
    category: 'math',
    syntax: 'sqrt(value), pow(base, exponent)',
    description: 'Square root and power functions.',
    params: '<strong>sqrt:</strong> Returns square root<br><strong>pow:</strong> Returns base^exponent',
    example: 'side = sqrt(100);\ncube(side);\n\nradius = pow(2, 3);\nsphere(radius);'
  },
  {
    name: 'Math: abs/min/max',
    category: 'math',
    syntax: 'abs(value), min(a,b), max(a,b)',
    description: 'Absolute value, minimum, and maximum functions.',
    params: '<strong>abs:</strong> Absolute value<br><strong>min/max:</strong> Returns smaller/larger of two values',
    example: 'size = abs(-10);\ncube(size);\n\ndim = max(5, 10);\nsphere(dim);'
  },

  // Special Variables
  {
    name: '$fn, $fa, $fs',
    category: 'math',
    syntax: '$fn=100; or circle(10, $fn=50);',
    description: 'Resolution control for curved surfaces. $fn = fragments, $fa = min angle, $fs = min size.',
    params: '<strong>$fn:</strong> Number of fragments (overrides $fa/$fs)<br><strong>$fa:</strong> Minimum angle (default 12°)<br><strong>$fs:</strong> Minimum fragment size (default 2mm)',
    example: '// Global\n$fn = 100;\n\n// Local\ncylinder(h=10, r=5, $fn=50);\nsphere(r=8, $fn=100);'
  },
  {
    name: 'import',
    category: 'modifiers',
    syntax: 'import("filename.stl");',
    description: 'Imports external 3D files (STL, OFF, DXF). DXF imports as 2D.',
    params: '<strong>file:</strong> Path to file<br><strong>convexity:</strong> For proper rendering (try values 1-10)',
    example: 'import("model.stl");\n\n// 2D import for extrusion\nlinear_extrude(5)\n  import("shape.dxf");'
  }
];

// Documentation Modal functionality
const docsModal = document.getElementById('docsModal');
const openDocsBtn = document.getElementById('openDocs');
const closeDocsBtn = document.getElementById('closeDocsModal');
const docsSearch = document.getElementById('docsSearch');
const docsContent = document.getElementById('docsContent');
const filterButtons = document.querySelectorAll('.docs-filter-btn');

let currentCategory = 'all';
let currentSearchTerm = '';

// Open modal
if (openDocsBtn) {
  openDocsBtn.addEventListener('click', () => {
    docsModal.classList.add('show');
    renderCommands();
    docsSearch.focus();
  });
}

// Close modal
if (closeDocsBtn) {
  closeDocsBtn.addEventListener('click', () => {
    docsModal.classList.remove('show');
  });
}

// Close on background click
docsModal.addEventListener('click', (e) => {
  if (e.target === docsModal) {
    docsModal.classList.remove('show');
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && docsModal.classList.contains('show')) {
    docsModal.classList.remove('show');
  }
});

// Search functionality
if (docsSearch) {
  docsSearch.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase();
    renderCommands();
  });
}

// Category filter
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    renderCommands();
  });
});

// Render commands based on filters
function renderCommands() {
  const filtered = openscadCommands.filter(cmd => {
    const matchesCategory = currentCategory === 'all' || cmd.category === currentCategory;
    const matchesSearch = !currentSearchTerm ||
      cmd.name.toLowerCase().includes(currentSearchTerm) ||
      cmd.description.toLowerCase().includes(currentSearchTerm) ||
      cmd.syntax.toLowerCase().includes(currentSearchTerm);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    docsContent.innerHTML = '<div class="docs-no-results">No commands found matching your search.</div>';
    return;
  }

  docsContent.innerHTML = filtered.map(cmd => `
    <div class="docs-command" data-category="${cmd.category}">
      <div class="docs-command-header">
        <h3 class="docs-command-name">${cmd.name}</h3>
        <span class="docs-command-category">${cmd.category}</span>
      </div>
      <div class="docs-command-description">${cmd.description}</div>
      <div class="docs-command-params">${cmd.params}</div>
      <div class="docs-command-example">
        <pre>${cmd.example}</pre>
      </div>
      <button class="docs-insert-btn" data-code="${cmd.example.replace(/"/g, '&quot;')}">
        ✨ Insert Code at Cursor
      </button>
    </div>
  `).join('');

  // Add click handlers to insert buttons
  document.querySelectorAll('.docs-insert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      insertCodeAtCursor(btn.dataset.code);
    });
  });
}

// Insert code at cursor position in Monaco editor
function insertCodeAtCursor(code) {
  if (!editor) return;

  const position = editor.getPosition();
  const range = new monaco.Range(
    position.lineNumber,
    position.column,
    position.lineNumber,
    position.column
  );

  editor.executeEdits('insert-docs-code', [{
    range: range,
    text: '\n' + code + '\n'
  }]);

  // Move cursor to end of inserted text
  const lines = code.split('\n');
  const newPosition = {
    lineNumber: position.lineNumber + lines.length + 1,
    column: 1
  };
  editor.setPosition(newPosition);
  editor.focus();

  // Close modal and show toast
  docsModal.classList.remove('show');
  showToast('Code inserted successfully!', 'success', 2000);
}

