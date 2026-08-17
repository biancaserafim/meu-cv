const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navItems = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section[id]");
const year = document.getElementById("year");
const interactiveCards = document.querySelectorAll(".tech-card, .project-card");

year.textContent = new Date().getFullYear();

menuToggle.addEventListener("click", () => {
    const opened = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", opened);
});

navItems.forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

// Interação principal: ao passar o mouse por tecnologias/projetos,
// a cor de destaque de toda a página muda para uma paleta relacionada ao card.
function activatePalette(element) {
    const paletteClass = [...element.classList].find((name) => name.startsWith("palette-"));
    if (!paletteClass) return;

    const palette = paletteClass.replace("palette-", "");
    document.body.dataset.palette = palette;
}

function resetPalette() {
    delete document.body.dataset.palette;
}

interactiveCards.forEach((card) => {
    card.addEventListener("mouseenter", () => activatePalette(card));
    card.addEventListener("mouseleave", resetPalette);
    card.addEventListener("focusin", () => activatePalette(card));
    card.addEventListener("focusout", (event) => {
        if (!card.contains(event.relatedTarget)) resetPalette();
    });
});

const HEADER_OFFSET = 110;

function updateActiveLink() {
    const scrollPos = window.scrollY + HEADER_OFFSET;
    let current = sections[0];

    sections.forEach((section) => {
        if (section.offsetTop <= scrollPos) current = section;
    });

    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (nearBottom) current = sections[sections.length - 1];

    navItems.forEach((item) => item.classList.remove("active"));
    const active = document.querySelector(`.nav-link[href="#${current.id}"]`);
    if (active) active.classList.add("active");
}

window.addEventListener("scroll", updateActiveLink, { passive: true });
window.addEventListener("resize", updateActiveLink);
updateActiveLink();

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");

        if (hash === "#inicio") {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const target = document.querySelector(hash);
        if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});


// Projetos: profundidade pelo cursor ao mover o mouse sobre o card.
document.querySelectorAll('.interactive-projects .project-card').forEach((card) => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform = `translateY(-5px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*3).toFixed(2)}deg)`;
      card.style.setProperty('--mx', `${x*100}%`);
      card.style.setProperty('--my', `${y*100}%`);
    });
    card.addEventListener('pointerleave', () => card.style.transform='');
  }
});

// Entrada escalonada da seção de projetos.
const projectObserver = new IntersectionObserver((entries) => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.querySelectorAll('.project-card').forEach((card,i)=>{
      card.style.opacity='0'; card.style.transform='translateY(22px)';
      setTimeout(()=>{card.style.transition='opacity .5s ease, transform .5s ease, box-shadow .3s ease';card.style.opacity='1';card.style.transform='';}, i*120);
    });
    projectObserver.unobserve(entry.target);
  }
}), {threshold:.18});
const projectSection=document.querySelector('#projetos'); if(projectSection) projectObserver.observe(projectSection);

// Entrada suave (fade + subida) para os demais cards ao entrarem na tela.
const revealEls = document.querySelectorAll('.reveal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (revealEls.length) {
  if (reducedMotion) {
    revealEls.forEach((el) => el.classList.add('in-view'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .15 });
    revealEls.forEach((el) => revealObserver.observe(el));
  }
}

// === Cor de destaque em tempo real (acompanha a paleta ativada pelo hover nos cards) ===
function hexToRgbTriplet(hex) {
    const clean = (hex || "").trim().replace("#", "");
    if (!clean) return "255,106,44";
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const int = parseInt(full, 16);
    if (Number.isNaN(int)) return "255,106,44";
    return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
}

let accentRGB = hexToRgbTriplet(getComputedStyle(document.body).getPropertyValue("--accent"));
new MutationObserver(() => {
    accentRGB = hexToRgbTriplet(getComputedStyle(document.body).getPropertyValue("--accent"));
}).observe(document.body, { attributes: true, attributeFilter: ["data-palette"] });

// === Spotlight: acende os pontinhos do grid de fundo ao redor do cursor ===
(function initGridGlow() {
    const glow = document.getElementById("bgGridGlow");
    if (!glow) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;

    let raf = null;
    window.addEventListener("mousemove", (e) => {
        glow.classList.add("active");
        if (raf) return;
        raf = requestAnimationFrame(() => {
            document.documentElement.style.setProperty("--mx", e.clientX + "px");
            document.documentElement.style.setProperty("--my", e.clientY + "px");
            raf = null;
        });
    });
    window.addEventListener("mouseleave", () => glow.classList.remove("active"));
})();

// === Mini terminal vivo no sticker </> : o texto troca de tempos em tempos ===
(function initTerminalChip() {
    const el = document.getElementById("termText");
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const words = ["</>", "{ }", "#!", "01"];
    let i = 0;
    setInterval(() => {
        i = (i + 1) % words.length;
        el.style.opacity = "0";
        setTimeout(() => {
            el.textContent = words[i];
            el.style.opacity = "1";
        }, 180);
    }, 2200);
})();

// === Fundo tecnológico animado: rede de partículas com pulsos de dados e ping ao clicar ===
(function initTechCanvas() {
    const canvas = document.getElementById("techCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    let w, h, dpr;
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const colors = ["255,106,44", "34,184,160", "255,143,182"];
    const count = Math.max(16, Math.min(46, Math.floor((w * h) / 38000)));
    const particles = Array.from({ length: count }, () => {
        const back = Math.random() < 0.45;
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1,
            r: back ? 1 + Math.random() * 1.1 : 1.5 + Math.random() * 1.6,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: back ? 0.07 + Math.random() * 0.07 : 0.15 + Math.random() * 0.13,
            back,
            dx: 0,
            dy: 0,
            pingUntil: 0,
        };
    });

    const mouse = { x: -9999, y: -9999 };
    if (fine && !reduced) {
        window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });
    }

    // Radar: uma linha varre lentamente a partir de um ponto fixo e "acorda" as partículas que cruza.
    let sweepAngle = 0;
    let lastFrameTime = performance.now();
    const sweepOrigin = { xFrac: 0.86, yFrac: 0.12 };

    // Pulsos: pequenos "pacotes de dados" que viajam de uma partícula à vizinha mais próxima.
    let pulses = [];
    function spawnPulse() {
        if (particles.length < 2) return;
        const a = particles[Math.floor(Math.random() * particles.length)];
        let best = null, bestDist = Infinity;
        particles.forEach((p) => {
            if (p === a) return;
            const d = Math.hypot(p.x - a.x, p.y - a.y);
            if (d < bestDist) { bestDist = d; best = p; }
        });
        if (!best || bestDist > Math.min(w, h) * 0.24) return;
        pulses.push({ a, b: best, born: performance.now(), dur: 900 + Math.random() * 500 });
    }
    if (!reduced) setInterval(spawnPulse, 2200);

    // Ping: onda ao clicar em qualquer lugar da página.
    let ripples = [];
    if (!reduced) {
        window.addEventListener("pointerdown", (e) => {
            if (ripples.length > 4) ripples.shift();
            ripples.push({ x: e.clientX, y: e.clientY, born: performance.now(), dur: 850 });
        });
    }

    const linkDist = () => Math.min(w, h) * 0.2;

    function frame(now) {
        const dt = now - lastFrameTime;
        lastFrameTime = now;
        if (!reduced) sweepAngle += dt * 0.00035;

        ctx.clearRect(0, 0, w, h);

        // Radar: linha giratória suave, com brilho decrescente até o fim do alcance.
        if (!reduced) {
            const ox = w * sweepOrigin.xFrac, oy = h * sweepOrigin.yFrac;
            const len = Math.max(w, h) * 0.52;
            const ex = ox + Math.cos(sweepAngle) * len, ey = oy + Math.sin(sweepAngle) * len;
            const sweepGrad = ctx.createLinearGradient(ox, oy, ex, ey);
            sweepGrad.addColorStop(0, `rgba(${accentRGB},.2)`);
            sweepGrad.addColorStop(1, `rgba(${accentRGB},0)`);
            ctx.strokeStyle = sweepGrad;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }

        // Rede de constelação: liga partículas próximas continuamente.
        const maxDist = linkDist();
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = (a.x + a.dx) - (b.x + b.dx);
                const dy = (a.y + a.dy) - (b.y + b.dy);
                const dist = Math.hypot(dx, dy);
                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * 0.13;
                    ctx.strokeStyle = `rgba(${accentRGB},${alpha.toFixed(3)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x + a.dx, a.y + a.dy);
                    ctx.lineTo(b.x + b.dx, b.y + b.dy);
                    ctx.stroke();
                }
            }
        }

        const sweepOx = w * sweepOrigin.xFrac, sweepOy = h * sweepOrigin.yFrac;
        let sweepNorm = sweepAngle % (Math.PI * 2);
        if (sweepNorm < 0) sweepNorm += Math.PI * 2;

        particles.forEach((p) => {
            if (!reduced) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;
            }

            let tx = 0, ty = 0;
            if (fine && !reduced) {
                const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
                const d = Math.hypot(mdx, mdy);
                const radius = 90;
                if (d < radius) {
                    const force = (1 - d / radius) * 13;
                    tx = (mdx / (d || 1)) * force;
                    ty = (mdy / (d || 1)) * force;
                }
            }
            p.dx += (tx - p.dx) * 0.08;
            p.dy += (ty - p.dy) * 0.08;

            // O radar "acorda" a partícula ao cruzar por ela: breve brilho, como um ping de rede.
            if (!reduced) {
                const pAngle = Math.atan2((p.y + p.dy) - sweepOy, (p.x + p.dx) - sweepOx);
                const pNorm = pAngle < 0 ? pAngle + Math.PI * 2 : pAngle;
                let diff = Math.abs(pNorm - sweepNorm);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff < 0.05) p.pingUntil = now + 700;
            }

            const pinging = p.pingUntil && now < p.pingUntil;
            const pingT = pinging ? (p.pingUntil - now) / 700 : 0;

            if (pinging) {
                ctx.shadowColor = `rgba(${accentRGB},.9)`;
                ctx.shadowBlur = 11 * pingT;
            }
            ctx.beginPath();
            ctx.fillStyle = pinging
                ? `rgba(${accentRGB},${Math.min(1, p.alpha + 0.6 * pingT).toFixed(3)})`
                : `rgba(${p.color},${p.alpha})`;
            ctx.arc(p.x + p.dx, p.y + p.dy, p.r, 0, Math.PI * 2);
            ctx.fill();
            if (pinging) ctx.shadowBlur = 0;
        });

        // Pulsos de dados viajando entre nós próximos.
        pulses = pulses.filter((p) => now - p.born < p.dur);
        pulses.forEach((p) => {
            const t = (now - p.born) / p.dur;
            const x = p.a.x + (p.b.x - p.a.x) * t;
            const y = p.a.y + (p.b.y - p.a.y) * t;
            const fade = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;

            ctx.strokeStyle = `rgba(${accentRGB},${(0.22 * fade).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.a.x, p.a.y);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = `rgba(${accentRGB},${(0.85 * fade).toFixed(3)})`;
            ctx.shadowColor = `rgba(${accentRGB},.9)`;
            ctx.shadowBlur = 8;
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Ondas de clique (ping).
        ripples = ripples.filter((r) => now - r.born < r.dur);
        ripples.forEach((r) => {
            const t = (now - r.born) / r.dur;
            const radius = t * 64;
            const alpha = (1 - t) * 0.32;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${accentRGB},${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.4;
            ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        if (!reduced) requestAnimationFrame(frame);
    }

    if (reduced) frame(performance.now());
    else requestAnimationFrame(frame);
})();

// Símbolos tecnológicos flutuantes (</>, {}, 01...) espalhados nas bordas da página.
(function initBgSymbols() {
    const host = document.getElementById("bgSymbols");
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const items = [
        { c: "</>", top: "6%",  left: "4%",  dir: "down", dur: 13, delay: 0 },
        { c: "{ }", top: "14%", left: "90%", dir: "up",   dur: 15, delay: 2 },
        { c: "01",  top: "28%", left: "8%",  dir: "up",   dur: 11, delay: 4, back: true },
        { c: "<>",  top: "34%", left: "93%", dir: "down", dur: 14, delay: 1 },
        { c: "//",  top: "46%", left: "3%",  dir: "down", dur: 12, delay: 6, glow: true },
        { c: "",    top: "52%", left: "95%", dir: "up",   dur: 9,  delay: 3, dot: true, size: "7px" },
        { c: "{ }", top: "62%", left: "6%",  dir: "up",   dur: 16, delay: 5, back: true },
        { c: "01",  top: "70%", left: "92%", dir: "down", dur: 13, delay: 2.5 },
        { c: "</>", top: "80%", left: "4%",  dir: "up",   dur: 12, delay: 7, glow: true },
        { c: "//",  top: "86%", left: "90%", dir: "down", dur: 10, delay: 1.5 },
        { c: "<>",  top: "50%", left: "1%",  dir: "down", dur: 14, delay: 4 },
        { c: "",    top: "10%", left: "50%", dir: "up",   dur: 10, delay: 5, dot: true, size: "6px", back: true },
    ];

    const colors = ["var(--accent)", "var(--teal)", "var(--pink)"];
    const els = [];

    items.forEach((item, i) => {
        const el = document.createElement("span");
        el.className = "bg-symbol" + (item.back ? " back" : "") + (item.dot ? " dot" : "");
        el.style.top = item.top;
        el.style.left = item.left;
        el.style.width = item.dot ? item.size : "auto";
        el.style.height = item.dot ? item.size : "auto";
        el.style.color = colors[i % colors.length];
        el.style.setProperty("--dur", item.dur + "s");
        el.style.setProperty("--delay", item.delay + "s");

        const base = item.dir === "up" ? "driftUp" : "driftDown";
        const name = (item.back ? base + "Back" : base) + (item.glow ? ", glowBlink" : "");
        el.style.animationName = name;

        const inner = document.createElement("span");
        inner.className = "bg-symbol-inner";
        inner.textContent = item.c;
        if (!item.dot) inner.style.fontSize = item.back ? "0.95rem" : "1.15rem";
        el.appendChild(inner);

        host.appendChild(el);
        els.push(el);
    });

    if (reduced) {
        els.forEach((el) => { el.style.animation = "none"; el.style.opacity = ".08"; });
        return;
    }

    if (fine) {
        window.addEventListener("mousemove", (e) => {
            els.forEach((el) => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                const near = Math.hypot(e.clientX - cx, e.clientY - cy) < 130;
                el.classList.toggle("near", near);
            });
        });
    }

    // Leve parallax ao rolar: os símbolos se deslocam um pouco mais devagar que o conteúdo,
    // criando sensação de profundidade sem exagero.
    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            host.style.transform = `translateY(${window.scrollY * 0.05}px)`;
            ticking = false;
        });
    }, { passive: true });
})();
