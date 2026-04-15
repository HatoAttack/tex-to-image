const texInput = document.getElementById('texInput');
const mathOutput = document.getElementById('mathOutput');
const errorMessage = document.getElementById('error');
const savePngBtn = document.getElementById('savePngBtn');
const saveSvgBtn = document.getElementById('saveSvgBtn');
const exampleButtons = document.querySelectorAll('.example-btn');

// バックスラッシュが前置されていない単語を LaTeX コマンドへ変換する
function preprocessTex(tex) {
  const symbolMap = [
    // ギリシャ文字（小文字）― var 系を先に処理して誤変換を防ぐ
    ['varepsilon', '\\varepsilon'],
    ['vartheta',   '\\vartheta'],
    ['varsigma',   '\\varsigma'],
    ['varphi',     '\\varphi'],
    ['varpi',      '\\varpi'],
    ['varrho',     '\\varrho'],
    ['epsilon',    '\\epsilon'],
    ['upsilon',    '\\upsilon'],
    ['lambda',     '\\lambda'],
    ['theta',      '\\theta'],
    ['sigma',      '\\sigma'],
    ['omega',      '\\omega'],
    ['alpha',      '\\alpha'],
    ['delta',      '\\delta'],
    ['gamma',      '\\gamma'],
    ['kappa',      '\\kappa'],
    ['zeta',       '\\zeta'],
    ['beta',       '\\beta'],
    ['iota',       '\\iota'],
    ['eta',        '\\eta'],
    ['phi',        '\\phi'],
    ['chi',        '\\chi'],
    ['psi',        '\\psi'],
    ['rho',        '\\rho'],
    ['tau',        '\\tau'],
    ['mu',         '\\mu'],
    ['nu',         '\\nu'],
    ['xi',         '\\xi'],
    ['pi',         '\\pi'],
    // ギリシャ文字（大文字）
    ['Upsilon',    '\\Upsilon'],
    ['Lambda',     '\\Lambda'],
    ['Theta',      '\\Theta'],
    ['Sigma',      '\\Sigma'],
    ['Omega',      '\\Omega'],
    ['Delta',      '\\Delta'],
    ['Gamma',      '\\Gamma'],
    ['Phi',        '\\Phi'],
    ['Psi',        '\\Psi'],
    ['Xi',         '\\Xi'],
    ['Pi',         '\\Pi'],
    // よく使う数学記号
    ['infty',      '\\infty'],
    ['nabla',      '\\nabla'],
    ['partial',    '\\partial'],
    ['forall',     '\\forall'],
    ['exists',     '\\exists'],
    // 演算子・関係記号
    ['approx',     '\\approx'],
    ['equiv',      '\\equiv'],
    ['neq',        '\\neq'],
    ['leq',        '\\leq'],
    ['geq',        '\\geq'],
    ['cdot',       '\\cdot'],
    ['pm',         '\\pm'],
    // 数学関数（長いものを先に）
    ['arcsin',     '\\arcsin'],
    ['arccos',     '\\arccos'],
    ['arctan',     '\\arctan'],
    ['sinh',       '\\sinh'],
    ['cosh',       '\\cosh'],
    ['tanh',       '\\tanh'],
    ['sin',        '\\sin'],
    ['cos',        '\\cos'],
    ['tan',        '\\tan'],
    ['cot',        '\\cot'],
    ['sec',        '\\sec'],
    ['csc',        '\\csc'],
    ['log',        '\\log'],
    ['ln',         '\\ln'],
    ['exp',        '\\exp'],
    ['lim',        '\\lim'],
    ['max',        '\\max'],
    ['min',        '\\min'],
    ['sup',        '\\sup'],
    ['inf',        '\\inf'],
    ['det',        '\\det'],
    ['gcd',        '\\gcd'],
  ];

  let result = tex;
  for (const [name, command] of symbolMap) {
    // バックスラッシュが直前にない単語境界でのみ置換する
    const regex = new RegExp(`(?<!\\\\)\\b${name}\\b`, 'g');
    result = result.replace(regex, command);
  }
  return result;
}

async function renderTex(tex) {
  if (!window.MathJax?.startup?.promise) return;

  try {
    await MathJax.startup.promise;
    const wrappedTex = `\\displaystyle ${preprocessTex(tex)}`;
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
