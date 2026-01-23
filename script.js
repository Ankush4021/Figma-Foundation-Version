let canvas = document.querySelector(".canvas-editor");
let addRctBtn = document.querySelector(".add-rectangle");
let addtextBtn = document.querySelector(".add-text");
let exportJSONBtn = document.querySelector(".export-json");

let element = [];

const state = {
  select: null,
  mode: null,
  resizeDir: null,
  offsetX: 0,
  offsetY: 0,
  startX: 0,
  startY: 0,
  startW: 0,
  startH: 0,
  startLeft: 0,
  startTop: 0,

  isRotating: false,
  centerX: 0,
  centerY: 0,
  startAngle: 0,
  rotation: 0,
};

function createRectangle() {
  const rect = document.createElement("div");
  const id = Date.now();

  rect.classList.add("element-rectangle");
  rect.dataset.id = id;
  rect.dataset.type = "rectangle";

  rect.style.height = "150px";
  rect.style.width = "200px";
  rect.style.backgroundColor = "#4C8DFF";
  rect.style.cursor = "pointer";
  rect.style.borderRadius = "5px";
  rect.style.position = "absolute";
  rect.style.left = "400px";
  rect.style.top = "200px";

  canvas.appendChild(rect);

  element.push({
    id: id,
    type: "rectangle",
    x: 400,
    y: 200,
    width: 200,
    height: 150,
    rotation: 0,
  });
}

function addText() {
  const textElement = document.createElement("div");
  const id = Date.now();

  textElement.classList.add("element-text");
  textElement.dataset.id = id;
  textElement.dataset.type = "text";

  textElement.innerText = "Doble Click to edit";

  textElement.style.position = "absolute";
  textElement.style.top = "150px";
  textElement.style.left = "150px";
  textElement.style.color = "#111";
  textElement.style.cursor = "pointer";
  textElement.style.padding = "8px 12px";
  textElement.style.userSelect = "none";
  textElement.style.border = "1px solid #111";

  canvas.appendChild(textElement);

  element.push({
    id: id,
    type: "text",
    x: 150,
    y: 150,
    width: null,
    height: null,
    text: "Double click to edit",
    rotation: 0,
  });
}

addRctBtn.addEventListener("click", function () {
  // console.log('clicked....');
  createRectangle();
});

addtextBtn.addEventListener("click", function () {
  addText();
});

function selectElement(elem) {
  deselectElement();
  state.select = elem;
  elem.classList.add("selected");

  addResizeHandler(elem);
  addRotateHandler(elem);
  updateProperties(elem);
}

function deselectElement() {
  if (!state.select) return;

  state.select.classList.remove("selected");
  state.select = null;

  propHeight.value = ""
  propWidth.value = ""
  propText.value = ""
  textPanel.style.display = "none"
}

canvas.addEventListener("click", function (elem) {
  const target = elem.target;

  if (
    target.classList.contains("element-rectangle") ||
    target.classList.contains("element-text")
  ) {
    selectElement(target);
  } else {
    deselectElement();
  }
});

canvas.addEventListener("mousedown", function (elem) {
  if (!state.select || elem.target !== state.select) return;

  state.mode = "drag";
  const elementRect = state.select.getBoundingClientRect();

  state.offsetX = elem.clientX - elementRect.left;
  state.offsetY = elem.clientY - elementRect.top;
});

document.addEventListener("mousemove", function (e) {
  if (!state.mode || !state.select) return;

  if (state.mode == "drag") {
    let canvasRect = canvas.getBoundingClientRect();

    let newX = e.clientX - canvasRect.left - state.offsetX;
    let newY = e.clientY - canvasRect.top - state.offsetY;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;

    newX = Math.min(newX, canvas.clientWidth - state.select.offsetWidth);
    newY = Math.min(newY, canvas.clientHeight - state.select.offsetHeight);

    state.select.style.left = newX + "px";
    state.select.style.top = newY + "px";
  }

  if (state.mode == "resize") {
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    let newW = state.startW;
    let newH = state.startH;
    let newLeft = state.startLeft;
    let newTop = state.startTop;

    const MIN = 30;

    if (state.resizeDir.includes("r")) {
      newW = state.startW + dx;
    }

    if (state.resizeDir.includes("l")) {
      newW = state.startW - dx;
      newLeft = state.startLeft + dx;
    }

    if (state.resizeDir.includes("b")) {
      newH = state.startH + dy;
    }

    if (state.resizeDir.includes("t")) {
      newH = state.startH - dy;
      newTop = state.startTop + dy;
    }

    if (newW >= MIN) {
      state.select.style.width = newW + "px";
      state.select.style.left = newLeft + "px";
    }

    if (newH >= MIN) {
      state.select.style.height = newH + "px";
      state.select.style.top = newTop + "px";
    }
  }

  if (state.mode == "rotate") {
    let currentAngle = getAngle(e.clientX, e.clientY);
    let diff = currentAngle - state.startAngle;

    let newRotation = state.rotation + diff;

    state.select.style.transform = `rotate(${newRotation}deg)`;
    state.select.dataset.rotation = newRotation;
  }
});

function addResizeHandler(elem) {
  if (elem.querySelectorAll(".resize-handler").length) return;

  const corners = ["tl", "tr", "bl", "br"];
  corners.forEach(function (dir) {
    const handle = document.createElement("div");
    handle.classList.add("resize-handler", dir);
    handle.dataset.dir = dir;

    elem.appendChild(handle);

    handle.addEventListener("mousedown", function (e) {
      e.stopPropagation();
      state.mode = "resize";
      state.resizeDir = dir;

      state.startX = e.clientX;
      state.startY = e.clientY;

      state.startH = elem.offsetHeight;
      state.startW = elem.offsetWidth;

      state.startLeft = elem.offsetLeft;
      state.startTop = elem.offsetTop;
    });
  });
}

document.addEventListener("mouseup", function () {
  if (state.mode) {
    saveLayout();
  }
  state.mode = null;
  state.resizeDir = null;
});

function addRotateHandler(elem) {
  if (elem.querySelector(".rotate-handle")) return;

  let handle = document.createElement("div");
  handle.classList.add("rotate-handle");

  elem.appendChild(handle);

  handle.addEventListener("mousedown", function (e) {
    e.stopPropagation();
    state.mode = "rotate";

    const r = elem.getBoundingClientRect();
    state.centerX = r.left + r.width / 2;
    state.centerY = r.top + r.height / 2;

    state.startAngle = getAngle(e.clientX, e.clientY);
    state.rotation = parseFloat(elem.dataset.rotation || 0);

    // saveLayout()
  });
}

function getAngle(x, y) {
  return Math.atan2(y - state.centerY, x - state.centerX) * (180 / Math.PI);
}

const propWidth = document.querySelector("#propertiesWidth");
const propHeight = document.querySelector("#propertiesHeight");
const propColor = document.querySelector("#propertiesColor");
const propText = document.querySelector("#propertiesText");

const textPanel = document.querySelector(".properties-text");

function updateProperties(elem) {
  propWidth.value = elem.offsetWidth;
  propHeight.value = elem.offsetHeight;

  const bg = window.getComputedStyle(elem).backgroundColor;

  // propColor.value =

  if (elem.dataset.type == "text") {
    textPanel.style.display = "block";
    propText.value = elem.innerText;
  } else {
    textPanel.style.display = "none";
  }
}

propWidth.addEventListener("input", function () {
  if (!state.select) return;
  state.select.style.width = propWidth.value + "px";
  saveLayout();
});

propHeight.addEventListener("input", function () {
  if (!state.select) return;
  state.select.style.height = propHeight.value + "px";
  saveLayout();
});

propText.addEventListener("input", function () {
  if (!state.select) return;
  if (state.select.dataset.type === "text") {
    state.select.innerText = propText.value;
    saveLayout();
  }
});

propColor.addEventListener("input", function () {
  if (!state.select) return;
  state.select.style.backgroundColor = propColor.value;
  saveLayout();
});

document.addEventListener("keydown", function (e) {
  if (!state.select) return;

  const count = 5;

  let left = state.select.offsetLeft;
  let top = state.select.offsetTop;

  if (e.key === "Delete") {
    state.select.remove();
    state.select = null;
    saveLayout();
    return;
  }

  if (e.key === "ArrowLeft") {
    left -= count;
  }
  if (e.key === "ArrowRight") {
    left += count;
  }
  if (e.key === "ArrowUp") {
    top -= count;
  }
  if (e.key === "ArrowDown") {
    top += count;
  }

  left = Math.max(
    0,
    Math.min(left, canvas.clientWidth - state.select.offsetWidth),
  );
  top = Math.max(
    0,
    Math.min(top, canvas.clientHeight - state.select.offsetHeight),
  );

  state.select.style.left = left + "px";
  state.select.style.top = top + "px";
});

function saveLayout() {
  const data = [];
  document
    .querySelectorAll(".element-rectangle, .element-text")
    .forEach(function (el) {
      data.push({
        id: el.dataset.id,
        type: el.dataset.type,
        x: el.offsetLeft,
        y: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
        rotation: el.dataset.rotation || 0,
        text: el.dataset.type === "text" ? el.innerText : " ",
        color: el.style.backgroundColor || " ",
      });
    });

  localStorage.setItem("figma-layout", JSON.stringify(data));
}

function loadLayout() {
  const data = JSON.parse(localStorage.getItem("figma-layout"));

  if (!data) return;

  canvas.innerHTML = "";

  data.forEach(function (item) {
    let el;

    if (item.type === "rectangle") {
      el = document.createElement("div");
      el.classList.add("element-rectangle");
      el.style.backgroundColor = item.color || "#4C8DFF";
    } else {
      el = document.createElement("div");
      el.classList.add("element-text");
      el.innerText = item.text;
      el.style.border = "1px solid #111";
    }

    el.dataset.id = item.id;
    el.dataset.type = item.type;

    el.style.position = "absolute";
    el.style.left = item.x + "px";
    el.style.top = item.y + "px";
    el.style.width = item.width + "px";
    el.style.height = item.height + "px";
    el.style.transform = `rotate(${item.rotation}deg)`;
    el.dataset.rotation = item.rotation;

    canvas.appendChild(el);
  });
}

function exportJSON() {
  const data = JSON.parse(localStorage.getItem("figma-layout"));

  if (!data) {
    alert("Nothing to Export!!");
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "figma-layout.json";
  a.click();

  URL.revokeObjectURL(url);
}

exportJSONBtn.addEventListener("click", exportJSON);


window.addEventListener("load", loadLayout);
