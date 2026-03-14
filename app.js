const texInput = document.getElementById('texInput');
const mathOutput = document.getElementById('mathOutput');
const errorMessage = document.getElementById('error');
const saveBtn = document.getElementById('saveBtn');
const exampleButtons = document.querySelectorAll('.example-btn');

async function renderTex(tex) {
  if (!window.MathJax || !MathJax.tex2svgPromise) {
    return;
  }

  try {
    const wrappedTex = `\\displaystyle ${tex}`;
    const svgNode = await MathJax.tex2svgPromise(wrappedTex, { display: true });
    mathOutput.replaceChildren(svgNode);
    errorMessage.hidden = true;
  } catch (error) {
    errorMessage.textContent = `数式のレンダリングに失敗しました: ${error.message}`;
    errorMessage.hidden = false;
  }
}

function downloadSvgAsPng() {
  const svg = mathOutput.querySelector('svg');

  if (!svg) {
    errorMessage.textContent = '保存できる出力がありません。TeX を入力してください。';
    errorMessage.hidden = false;
    return;
  }

  const clonedSvg = svg.cloneNode(true);
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const serialized = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  img.onload = () => {
    const padding = 24;
    const canvas = document.createElement('canvas');
    canvas.width = img.width + padding * 2;
    canvas.height = img.height + padding * 2;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, padding, padding);

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'tex-formula.png';
    link.click();

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

texInput.addEventListener('input', (event) => {
  renderTex(event.target.value);
});

saveBtn.addEventListener('click', downloadSvgAsPng);

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
