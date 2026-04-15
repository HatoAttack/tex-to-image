const texInput = document.getElementById('texInput');
const mathOutput = document.getElementById('mathOutput');
const errorMessage = document.getElementById('error');
const savePngBtn = document.getElementById('savePngBtn');
const saveSvgBtn = document.getElementById('saveSvgBtn');
const exampleButtons = document.querySelectorAll('.example-btn');

async function renderTex(tex) {
  if (!window.MathJax?.startup?.promise) return;

  try {
    await MathJax.startup.promise;
    const wrappedTex = `\\displaystyle ${tex}`;
    const svgNode = await MathJax.tex2svgPromise(wrappedTex, { display: true });
    mathOutput.replaceChildren(svgNode);
    errorMessage.hidden = true;
  } catch (error) {
    errorMessage.textContent = `数式のレンダリングに失敗しました: ${error.message}`;
    errorMessage.hidden = false;
  }
}

function triggerDownload(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getSvgElement() {
  const svg = mathOutput.querySelector('svg');
  if (!svg) {
    errorMessage.textContent = '保存できる出力がありません。TeX を入力してください。';
    errorMessage.hidden = false;
  }
  return svg;
}

function downloadAsSvg() {
  const svg = getSvgElement();
  if (!svg) return;

  const clonedSvg = svg.cloneNode(true);
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const serialized = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, 'tex-formula.svg');
  URL.revokeObjectURL(url);
}

function downloadAsPng() {
  const svg = getSvgElement();
  if (!svg) return;

  const clonedSvg = svg.cloneNode(true);
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const viewBox = svg.viewBox.baseVal;
  const scale = 4;
  const padding = 24;

  const serialized = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const drawWidth = (viewBox.width || img.naturalWidth) * scale;
    const drawHeight = (viewBox.height || img.naturalHeight) * scale;
    canvas.width = drawWidth + padding * 2;
    canvas.height = drawHeight + padding * 2;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, padding, padding, drawWidth, drawHeight);

    const pngUrl = canvas.toDataURL('image/png');
    triggerDownload(pngUrl, 'tex-formula.png');
    URL.revokeObjectURL(url);
  };

  img.onerror = () => {
    errorMessage.textContent = 'PNG への変換に失敗しました。';
    errorMessage.hidden = false;
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

let debounceTimer;
texInput.addEventListener('input', (event) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => renderTex(event.target.value), 300);
});

savePngBtn.addEventListener('click', downloadAsPng);
saveSvgBtn.addEventListener('click', downloadAsSvg);

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    texInput.value = button.dataset.example;
    renderTex(texInput.value);
  });
});

window.addEventListener('load', async () => {
  if (window.MathJax?.startup?.promise) {
    await MathJax.startup.promise;
  }
  renderTex(texInput.value);
});
