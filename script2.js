const html = document.documentElement;
const titulo = document.querySelector('.info_title');
const text = document.querySelector('.info_text');

const botao_default = document.querySelector('.botao_default');
const botao_verao = document.querySelector('.botao_verao');
const botao_inverno = document.querySelector('.botao_inverno');
const botao_primavera = document.querySelector('.botao_primavera');
const abreFechaPomodoro = document.querySelector('#pomodoro_button');
const temporizador = document.querySelector('.temporizador');
const botaoComeçarPausar = document.querySelector('#pomodoroStart');

const cronometro = document.querySelector('.cronometro');
const inputTempo = document.createElement('input');
const displayTempo = document.createElement('span');

const soundsAlert ={
  soundTomatoBtn: "assets/sons/tomato-squishwet.mp3",
  soundTimeOff: "assets/sons/timer-terminer.mp3"
}

const botoes = document.querySelectorAll('.controles-botao');
// controle de volume da música de contexto
const volumeSlider = document.getElementById("music-volume");

const toggle = document.getElementById("info-button");
const musica = new Audio()
musica.loop = true;

const sons = {
  default:   'assets/sons/default.mp3',
  verao: 'assets/sons/Brazilian-Sunset.mp3',
  inverno:   'assets/sons/Copacabana-Beach-Dreams.mp3',
  primavera: 'assets/sons/Samba-Atomica.mp3',
}


let minutos = 25;
let tempoDecorridoEmSegundos = minutos * 60;
let intervaloId = null

inputTempo.type = 'text';                 // vamos sempre exibir MM:SS
inputTempo.className = 'cronometro-input';
inputTempo.value = '';                    // valor virá do setViewMode()

displayTempo.className = 'cronometro-display';

// coloca os dois dentro da .cronometro
cronometro.appendChild(inputTempo);
cronometro.appendChild(displayTempo);


if (volumeSlider) {
  musica.volume = volumeSlider.value; // inicia com valor do slider
  volumeSlider.addEventListener("input", e => {
    musica.volume = e.target.value;
  });
}



function getContexto() {
  return html.getAttribute("data-contexto") || "verao";
}

botao_default.addEventListener('click', function() {
    mudar_contexto('default');
    titulo.textContent = 'Chose your theme!';
    text.textContent = '...';
});
botao_verao.addEventListener('click', function() {
    mudar_contexto('verao');
    titulo.textContent = 'Verão';
    text.textContent = 'É, é o verão não tem como...';
    botao_verao.classList.add('active')
});
botao_inverno.addEventListener('click', function(){
    mudar_contexto('inverno');
    titulo.textContent = 'Inverno';
    text.textContent = 'Eita que friozin boum...';
    botao_inverno.classList.add('active')
});
botao_primavera.addEventListener('click', function(){
    mudar_contexto('primavera');
    titulo.textContent = 'Primavera';
    text.textContent = 'Vish, chei de fûlo! ';
    botao_primavera.classList.add('active')
});

function mudar_contexto(contexto){
  botoes.forEach(function(contexto){
    contexto.classList.remove('active');
  })
    html.setAttribute('data-contexto', contexto);
    if (toggle.checked) {
      setAudioByContext();
      musica.currentTime = 0;
      musica.play().catch(console.warn);
    }
}

function setAudioByContext(){
  const contexto = getContexto();
  const src = sons[contexto] || sons.default || sons.verao;
  // evita recarregar se já é a mesma URL
  if (src && musica.src !== new URL(src, location.href).href){
    musica.src = src;
    musica.load();
  }
}

toggle.addEventListener("change", () => {
  setAudioByContext();
  if (toggle.checked) {
    musica.currentTime = 0;
    musica.play().catch(console.warn);
  } else {
    musica.pause();
  }
});

// efeito CHUVA 🌧️🌧️🌧️🌧️
//       '   '
//      '   '
//       '    '
//     '  '  '

(function(){
  let canvas, ctx, drops = [], animId = null;
  let wind = 0.8;        // vento horizontal (px/frame)
  let thickness = 1.1;   // espessura da gota
  let running = false;

  // === ÁUDIO DE CHUVA ===
  const rainAudio = new Audio('assets/sons/calming-rain-257596.mp3'); // ajuste o caminho
  rainAudio.loop = true;
  rainAudio.preload = 'auto';

  // faixa do seu slider
  const INT_MIN = 50;
  const INT_MAX = 1200;

  // intensidade (slider) -> volume [0..~0.85], curva suave
  function volumeFromIntensity(val){
    const x = Math.min(1, Math.max(0, (val - INT_MIN) / (INT_MAX - INT_MIN)));
    const eased = Math.pow(x, 0.7);
    return Math.min(0.85, eased * 0.75);
  }

  async function startRainAudio(){
    const slider = document.getElementById('intensidade');
    const vol = volumeFromIntensity(slider ? +slider.value : 400);
    rainAudio.volume = vol;
    try { await rainAudio.play(); } catch(e){ console.warn('Áudio bloqueado até interação do usuário', e); }
  }
  function stopRainAudio(){ rainAudio.pause(); }

  function createCanvas(){
    canvas = document.getElementById('rain-canvas');
    if(!canvas){
      canvas = document.createElement('canvas');
      canvas.id = 'rain-canvas';
      canvas.style.position = 'fixed';
      canvas.style.inset = 0;
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = 9999;
      document.body.appendChild(canvas);
    }
    resize();
    ctx = canvas.getContext('2d');
  }

  function resize(){
    if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    if(ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function makeDrop(){
    const speed = 8 + Math.random()*9;
    return {
      x: Math.random() * innerWidth,
      y: -20 - Math.random()*innerHeight,
      vy: speed,
      vx: wind * (0.5 + Math.random()),
      len: 8 + Math.random()*18,
      alpha: 0.5 + Math.random()*0.4
    };
  }

  function populate(n){
    drops.length = 0;
    for(let i=0;i<n;i++) drops.push(makeDrop());
  }

  function step(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';

    for(let d of drops){
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx*1.2, d.y - d.len);
      ctx.stroke();

      d.x += d.vx;
      d.y += d.vy;

      if(d.y - d.len > innerHeight || d.x < -50 || d.x > innerWidth+50){
        const idx = drops.indexOf(d);
        drops[idx] = makeDrop();
        drops[idx].y = -20;
      }
    }
    animId = requestAnimationFrame(step);
  }

  function startRain(count=400){
    if(running) return;
    createCanvas();
    populate(count);
    running = true;
    animId = requestAnimationFrame(step);
    startRainAudio();               // <<< liga o áudio junto
  }

  function stopRain(){
    running = false;
    if(animId) cancelAnimationFrame(animId);
    animId = null;
    if(ctx) ctx.clearRect(0,0,innerWidth,innerHeight);
    stopRainAudio();                // <<< desliga o áudio
  }

  // Controles UI
  window.addEventListener('resize', resize);

  // botão/checkbox de ON/OFF da chuva
  document.getElementById('toggle-rain')?.addEventListener('change', ()=>{
    running ? stopRain() : startRain(+document.getElementById('intensidade')?.value || 400);
  });

  // slider de intensidade: ajusta gotas E volume
  document.getElementById('intensidade')?.addEventListener('input', e=>{
    const alvo = +e.target.value;
    if(running){
      const delta = alvo - drops.length;
      if(delta > 0){ for(let i=0;i<delta;i++) drops.push(makeDrop()); }
      else if(delta < 0){ drops.splice(0, Math.min(drops.length, Math.abs(delta))); }
    }
    rainAudio.volume = volumeFromIntensity(alvo); // <<< volume segue intensidade
  });

  // inicia automaticamente no inverno (opcional)
  const html = document.documentElement;
  const contexto = html.getAttribute('data-contexto');
  if(contexto === 'inverno'){ startRain(500); }

  // API global opcional
  window.RainFX = {
    start: (n)=> startRain(n || 400),
    stop: stopRain,
    setWind: (w)=> wind = w,
    setThickness: (t)=> thickness = t,
    setVolumeByIntensity: (i)=> rainAudio.volume = volumeFromIntensity(i)
  };
})();
//


const contagemRegressiva = () =>{
   if(tempoDecorridoEmSegundos <=0 ){
    timeOff()
    return
   }
  tempoDecorridoEmSegundos -= 1
  valorCronometro()
}

abreFechaPomodoro.addEventListener('click', ()=>{
  const aberto = abreFechaPomodoro.getAttribute('aria-expanded') === 'true';
  abreFechaPomodoro.setAttribute('aria-expanded', String(!aberto));
  temporizador.hidden = aberto;

  

  const audio = new Audio(soundsAlert.soundTomatoBtn);
  audio.currentTime = 0;
  audio.play();
  abreFechaPomodoro.innerHTML = aberto
    ? '<img src="assets/tomate.png" alt="tomate" width="24">'
    : '<img src="assets/tomate (1).png" alt="salada" width="24">';

});

function iniciarouPausar(){
  if (intervaloId) {
    // PAUSAR
    zerar();
    botaoComeçarPausar.textContent = 'Começar';
    setViewMode();     // mostra MM:SS atual
    return;
  }
  // COMEÇAR
  if (editing) exitEdit(true); // aplica o que estiver digitado
  setRunMode();
  valorCronometro();
  intervaloId = setInterval(contagemRegressiva, 1000);
  botaoComeçarPausar.textContent = 'Pausar';
}




function zerar(){
  clearInterval(intervaloId)
  intervaloId=null
}
function timeOff(){
  const audio = new Audio(soundsAlert.soundTimeOff);
  audio.currentTime = 0;
  audio.play();
  zerar();
  setViewMode(); // continua mostrando 00:00
  setTimeout(() => alert('time off!'), 150);
}


botaoComeçarPausar.addEventListener('click',()=>{
  iniciarouPausar()
});

function formatMMSS(seg) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0');
  const s = (seg % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// aceita "mm", "mm:ss"
function parseMMSS(str) {
  const t = (str || '').trim();
  if (t.includes(':')) {
    let [m, s = '0'] = t.split(':');
    const min = Math.max(0, parseInt(m, 10) || 0);
    let sec  = Math.max(0, parseInt(s, 10) || 0);
    if (sec > 59) sec = 59;           // trava 0–59
    return min * 60 + sec;
  }
  const min = Math.max(0, parseInt(t, 10) || 0);
  return min * 60;
}

let editing = false; // se está editando minutos

function setViewMode() {
  inputTempo.disabled = false;
  inputTempo.type = 'text';
  inputTempo.value = formatMMSS(tempoDecorridoEmSegundos);
}

// rodando: mostra MM:SS e trava
function setRunMode() {
  inputTempo.disabled = true;
  inputTempo.type = 'text';
  inputTempo.value = formatMMSS(tempoDecorridoEmSegundos);
}

// entra em edição (parado)
function enterEdit() {
  editing = true;
  inputTempo.disabled = false;
  inputTempo.type = 'text';
  inputTempo.value = formatMMSS(tempoDecorridoEmSegundos);
  // seleciona tudo p/ facilitar
  requestAnimationFrame(() => inputTempo.select());
}

// sai da edição (commit true = aplica)
function exitEdit(commit = true) {
  if (commit) {
    const secs = Math.max(1, parseMMSS(inputTempo.value)); // pelo menos 1s
    tempoDecorridoEmSegundos = secs;
  }
  editing = false;
  setViewMode();
}

// usado pelo tick
function valorCronometro() {
  inputTempo.value = formatMMSS(tempoDecorridoEmSegundos);
}


// ===== listeners do input =====
inputTempo.addEventListener('focus', () => {
  if (!intervaloId && !editing) enterEdit();
});

inputTempo.addEventListener('blur', () => {
  if (!intervaloId && editing) exitEdit(true);
});

inputTempo.addEventListener('keydown', (e) => {
  if (!intervaloId && editing) {
    if (e.key === 'Enter') exitEdit(true);   // confirma
    if (e.key === 'Escape') exitEdit(false); // cancela
  }
});

// (opcional) enquanto digita já atualiza a variável, sem reformatar
inputTempo.addEventListener('input', () => {
  if (editing) {
    const secs = parseMMSS(inputTempo.value);
    if (!Number.isNaN(secs)) tempoDecorridoEmSegundos = Math.max(0, secs);
  }
});

setViewMode();        // >>> vai exibir 25:00
valorCronometro();
