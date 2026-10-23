import stampImg from './assets/images/image.png';

/**
 * NHẬT KÝ CÁ NHÂN KẾT HỢP LÁ THƯ VIẾT TAY
 * Giai điệu: toidaidot - GREY D
 * Tự động phát nhạc ngầm khi ấn mở thư, giao diện thuần túy lãng mạn
 */

// Application state
const state = {
  isEnvelopeOpen: false,
  isPlaying: false,
  audioContext: null
};

// --------------------------------------------------------------------------
// 1. WEB AUDIO API SYNTHESIZER (Hiệu ứng âm thanh khi mở thư)
// --------------------------------------------------------------------------
function getAudioContext() {
  if (!state.audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      state.audioContext = new AudioCtx();
    }
  }
  if (state.audioContext && state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }
  return state.audioContext;
}

// Tiếng tách sáp giòn tan
function playSealCrackSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(880, now + 0.04);
    chime.frequency.exponentialRampToValueAtTime(1320, now + 0.22);
    chimeGain.gain.setValueAtTime(0.15, now + 0.04);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now + 0.04);
    chime.stop(now + 0.32);
  } catch (e) {}
}

// Tiếng sột soạt rút giấy
function playPaperSlideSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3.0, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
}

// --------------------------------------------------------------------------
// 2. PHÁT NHẠC TỰ ĐỘNG "toidaidot - GREY D"
// - Bắt đầu từ đoạn: "Chợt nhận ra..." (00:31 ~ 30.8s)
// - Bỏ qua đoạn: "Tỉnh giấc mới biết rằng là..." (02:03.5 ~ 123.5s -> nhảy đến 02:24 ~ 143.8s)
// --------------------------------------------------------------------------
function startMusicPlayback() {
  getAudioContext();
  state.isPlaying = true;

  const START_SECOND = 30.8; // Đoạn 'Chợt nhận ra'
  const SKIP_START = 123.5;   // Trước khi vào 'Tỉnh giấc mới biết rằng là'
  const SKIP_END = 143.8;     // Nhảy sang điệp khúc 'Ngày hôm ấy đã quá ngốc'

  const localAudio = document.getElementById('localAudio');
  if (localAudio) {
    try {
      // Đảm bảo chỉ phát 1 luồng âm thanh duy nhất
      localAudio.pause();
      localAudio.currentTime = START_SECOND;
      localAudio.volume = 1.0;
      localAudio.play().catch(err => {
        console.warn('Playback error:', err);
      });

      // Tự động bỏ qua đoạn 'Tỉnh giấc mới biết rằng là'
      localAudio.ontimeupdate = () => {
        if (localAudio.currentTime >= SKIP_START && localAudio.currentTime < SKIP_END) {
          localAudio.currentTime = SKIP_END;
        }
      };
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

// --------------------------------------------------------------------------
// 3. HIỆU ỨNG MỞ PHONG BÌ & NỘI DUNG HIỆN DẦN
// --------------------------------------------------------------------------
function openEnvelope(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (state.isEnvelopeOpen) return;
  state.isEnvelopeOpen = true;

  // Đảm bảo nội dung lá thư đã được đổ vào DOM
  renderLetterContent();

  const envelopeBox = document.getElementById('envelopeBox');
  const envelopeStage = document.getElementById('envelopeStage');
  const journalStage = document.getElementById('journalStage');

  if (envelopeBox) envelopeBox.classList.add('opening');

  // Âm thanh vỡ sáp và rút thư
  try {
    playSealCrackSound();
    setTimeout(playPaperSlideSound, 250);
  } catch (err) {
    console.warn('Audio sound error:', err);
  }

  // Kích hoạt phát nhạc toidaidot của GREY D ngay khi người dùng chạm mở thư
  try {
    startMusicPlayback();
  } catch (err) {
    console.warn('Music playback error:', err);
  }

  // Bắn pháo hoa cánh hoa & trái tim
  try {
    createParticleBurst(window.innerWidth / 2, window.innerHeight * 0.45);
  } catch (err) {
    console.warn('Particle error:', err);
  }

  // Bắn sự kiện để EmailJS (hoặc analytics) ghi nhận người dùng đã mở thư
  try {
    window.dispatchEvent(new CustomEvent('envelopeOpened'));
  } catch (err) {
    console.warn('Event error:', err);
  }

  // Mở ra trang nhật ký và lá thư tay
  setTimeout(() => {
    if (envelopeStage) envelopeStage.classList.add('opened');
    if (journalStage) {
      journalStage.classList.remove('hidden');
      triggerLetterProgressiveReveal();
      journalStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 900);
}

function triggerLetterProgressiveReveal() {
  const paragraphs = document.querySelectorAll('#letterBody .fade-paragraph, .letter-footer');
  paragraphs.forEach((p, idx) => {
    p.style.animation = 'none';
    p.offsetHeight; // trigger reflow
    p.style.animation = `inkAppear 0.9s ease forwards ${(idx * 0.45) + 0.2}s`;
  });
}

// --------------------------------------------------------------------------
// 4. CÁNH HOA BAY TRÊN MÀN HÌNH
// --------------------------------------------------------------------------
function createParticleBurst(centerX, centerY) {
  const emojis = ['🌸', '💖', '🐾', '✨', '🍓', '🎀'];

  for (let i = 0; i < 26; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.position = 'fixed';
    el.style.left = `${centerX}px`;
    el.style.top = `${centerY}px`;
    el.style.fontSize = `${Math.random() * 14 + 16}px`;
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.transition = 'all 1.2s cubic-bezier(0.1, 0.8, 0.3, 1)';
    document.body.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 180 + 60;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 40;

    requestAnimationFrame(() => {
      el.style.transform = `translate(${destX}px, ${destY}px) scale(0)`;
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), 1300);
  }
}

function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = 26;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 6,
      speedX: Math.random() * 1.2 - 0.4,
      speedY: Math.random() * 1.5 + 0.6,
      angle: Math.random() * 360,
      angleSpeed: Math.random() * 2 - 1,
      color: Math.random() > 0.4 ? 'rgba(247, 185, 205, 0.65)' : 'rgba(255, 230, 240, 0.55)',
      isPaw: Math.random() > 0.85
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.angle += p.angleSpeed;

      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      if (p.x > width + 20) p.x = -20;
      if (p.x < -20) p.x = width + 20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);

      if (p.isPaw) {
        ctx.fillStyle = 'rgba(230, 140, 165, 0.4)';
        ctx.font = '12px sans-serif';
        ctx.fillText('🐾', 0, 0);
      } else {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.ellipse(0, 0, p.size, p.size * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    requestAnimationFrame(render);
  }
  render();
}

// --------------------------------------------------------------------------
// NỘI DUNG LÁ THƯ (Được lưu trong JS để tránh bị bot quét trộm vào link preview)
// --------------------------------------------------------------------------
const LETTER_DATA = {
  salutation: 'Gửi em,',
  signature: 'TNNH',
  paragraphs: [
    { text: 'Sau thời gian qua, anh đã nghiêm túc nhìn lại mối quan hệ của mình.', delay: 'delay-1' },
    { text: 'Anh biết em đã cho anh nhiều cơ hội, và anh đã không trân trọng nó. Mỗi lần xin lỗi rồi lặp lại dần làm em mất niềm tin. Anh hiểu vì sao em nghĩ anh khó thay đổi.', delay: 'delay-2' },
    { text: 'Anh để cảm xúc nhất thời lấn át lý trí, anh nói những lời khó nghe làm em cảm thấy mình không được coi trọng. Anh muốn em biết rằng đó không phải cách anh nhìn về em, cũng không phải những gì anh thật lòng nghĩ về em.', delay: 'delay-3' },
    { text: 'Em đã rất áp lực khi ở bên anh. Những lần cãi nhau, anh không giải quyết được trọn vẹn nên mọi thứ tích tu dần khiến em kiệt sức. Anh cũng đã bỏ qua cảm xúc của em.', delay: 'delay-4' },
    { text: 'Anh nhận ra có những lúc em cần được lắng nghe, nhưng anh chỉ dỗ dành qua loa. Khi em buồn hay tức giận, anh đã có lúc chọn im lặng thay vì cố gắng hiểu điều gì đang khiến em tổn thương.', delay: 'delay-4' },
    { text: 'Anh hiểu em lo lắng những chuyện cũ sẽ lặp lại.', delay: 'delay-4' },
    { text: 'Anh xin lỗi vì những tổn thương, những lần anh chưa đủ trưởng thành. Anh biết xin lỗi không lập tức lấy lại được niềm tin đã mất.', delay: 'delay-5' },
    { text: 'Em giúp anh nhận ra rằng tình yêu lớn thôi chưa đủ, mà còn phải học cách thấu hiểu, lắng nghe, tôn trọng cảm xúc của em. Yêu em không chỉ là muốn ở bên em, mà còn biết cách đối xử với em bằng sự dịu dàng.', delay: 'delay-6' },
    { text: 'Anh cũng đã và đang học cách bình tĩnh, biết lắng nghe, quan tâm và chịu trách nhiệm cho hành động và lời nói của mình. Anh sẽ nghiêm túc sửa đổi bản thân và để hành động chứng minh điều anh nói.', delay: 'delay-7' },
    { text: 'Anh rất yêu mindset của em, sở thích, tính cách và sự hiểu chuyện mà em đã dành cho anh. Em ở bên anh những lúc anh mệt mỏi, áp lực, khó khăn. Anh biết điều đó không hề dễ dàng chút nào.', delay: 'delay-8' },
    { text: 'Anh vẫn luôn mong mình có thể tiếp tục đồng hành cùng em, cố gắng trong học tập, phát triển sự nghiệp và tương lai cả hai từng mong muốn.', delay: 'delay-9' },
    { text: 'Và anh cũng mong rằng những lúc em mệt mỏi, buồn bã, mất đi động lực, anh có thể là người em tin tưởng và cho em một chỗ dựa khi em cần.', delay: 'delay-9' },
    { text: 'Một ngày nào đó nếu em còn mong muốn và cảm thấy anh đã thực sự thay đổi, anh mong mình có cơ hội bắt đầu lại cùng em. Không để tuột mất em một lần nào nữa!', delay: 'delay-10' }
  ]
};

function renderLetterContent() {
  const salutation = document.getElementById('letterSalutation');
  if (salutation) {
    salutation.textContent = LETTER_DATA.salutation;
  }

  const letterBody = document.getElementById('letterBody');
  if (letterBody) {
    letterBody.innerHTML = LETTER_DATA.paragraphs
      .map(p => `<p class="fade-paragraph ${p.delay}">${p.text}</p>`)
      .join('\n');
  }

  const sig = document.getElementById('signatureText');
  if (sig) {
    sig.textContent = LETTER_DATA.signature;
  }
}

// --------------------------------------------------------------------------
// 6. KHỞI TẠO
// --------------------------------------------------------------------------
function init() {
  // Nạp nội dung bức thư bằng JavaScript
  renderLetterContent();

  // Nạp ảnh tem thư qua JS để các công cụ quét link (Zalo, Facebook, Telegram...) không quét thấy thẻ <img> trong HTML tĩnh
  document.querySelectorAll('.stamp-img').forEach((img) => {
    img.src = stampImg;
  });

  const envelopeBox = document.getElementById('envelopeBox');
  const waxSeal = document.getElementById('waxSeal');
  const peekingCat = document.getElementById('peekingCat');

  if (envelopeBox) {
    envelopeBox.onclick = openEnvelope;
  }

  if (waxSeal) {
    waxSeal.onclick = (e) => {
      e.stopPropagation();
      openEnvelope(e);
    };
  }

  if (peekingCat) {
    peekingCat.onclick = openEnvelope;
  }

  initAmbientCanvas();

  console.log('🌸 Trang Nhật ký & Thư tay sạch đẹp đã sẵn sàng!');
}

// Gắn trực tiếp vào window để hỗ trợ cả onclick inline và module scope
window.openEnvelope = openEnvelope;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Nếu DOM đã sẵn sàng (hoặc trong in-app browser như Zalo/Messenger), khởi chạy ngay lập tức
  init();
}
