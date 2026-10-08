/* Plateforme TP Big Data — ISI — scripts communs
   - lien actif dans la barre de navigation
   - sommaire généré à partir des titres h2 du document
   - bouton « Copier » et étiquette de langage sur chaque bloc de code
   - tableaux défilants sur petit écran */
(function () {
  "use strict";

  // Lien actif
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav a").forEach(function (a) {
    if ((a.getAttribute("href") || "").toLowerCase() === page) a.classList.add("active");
  });

  var doc = document.querySelector(".doc");
  if (!doc) return;

  // Identifiants des titres + sommaire
  var slug = function (s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  };
  var heads = Array.prototype.slice.call(doc.querySelectorAll("h2"));
  var tocList = document.querySelector(".toc ol");
  var used = {};
  heads.forEach(function (h) {
    if (!h.id) {
      var id = slug(h.textContent) || "section";
      while (used[id]) id += "-b";
      h.id = id;
    }
    used[h.id] = true;
    if (tocList) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.trim();
      li.appendChild(a);
      tocList.appendChild(li);
    }
  });

  if (tocList && "IntersectionObserver" in window) {
    var links = {};
    tocList.querySelectorAll("a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("current"); });
          if (links[e.target.id]) links[e.target.id].classList.add("current");
        }
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    heads.forEach(function (h) { obs.observe(h); });
  }

  // Tableaux défilants
  doc.querySelectorAll("table").forEach(function (t) {
    if (t.parentElement.classList.contains("table-wrap")) return;
    var w = document.createElement("div");
    w.className = "table-wrap";
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });

  // Coloration des blocs shell sans classe (TP1/TP2), aux couleurs du cours
  var CMDS = ("sudo apt apt-get hdfs hadoop yarn mapred jps java javac which readlink ssh ssh-keygen ssh-copy-id scp " +
    "cat cd ls mkdir chmod chown nano vi export source wget curl tar mv cp rm echo su adduser usermod passwd " +
    "hostnamectl netplan mvn docker python3 pip for do done if then fi exit beeline head tail grep git systemctl " +
    "unzip start-all.sh stop-all.sh start-dfs.sh stop-dfs.sh start-yarn.sh stop-yarn.sh").split(" ");
  var esc = function (t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var shLine = function (line) {
    var out = "", rest = line, m;
    // commentaire en fin de ligne (# en début de ligne ou précédé d'un espace, hors chaîne)
    var com = "";
    var inS = null;
    for (var i = 0; i < rest.length; i++) {
      var ch = rest[i];
      if (inS) { if (ch === inS) inS = null; continue; }
      if (ch === "'" || ch === '"') { inS = ch; continue; }
      if (ch === "#" && (i === 0 || /\s/.test(rest[i - 1]))) { com = rest.slice(i); rest = rest.slice(0, i); break; }
    }
    var first = true;
    var re = /(\s+)|('[^']*'|"[^"]*")|(\$\{?[A-Za-z_][A-Za-z0-9_]*\}?)|(&&|\|\||\||>>|>|<<|;|\\$)|([^\s'"$|&;>]+)/g;
    while ((m = re.exec(rest)) !== null) {
      if (m[1]) { out += m[1]; continue; }
      if (m[2]) { out += '<span class="sh-str">' + esc(m[2]) + "</span>"; first = false; continue; }
      if (m[3]) { out += '<span class="sh-var">' + esc(m[3]) + "</span>"; first = false; continue; }
      if (m[4]) { out += '<span class="sh-op">' + esc(m[4]) + "</span>"; if (m[4] !== ">" && m[4] !== ">>" && m[4] !== "\\") first = true; continue; }
      var w = m[5];
      if (first && CMDS.indexOf(w) !== -1) { out += '<span class="sh-cmd">' + esc(w) + "</span>"; first = (w === "sudo" || w === "do" || w === "then"); continue; }
      if (/^--?[A-Za-z]/.test(w)) { out += '<span class="sh-flag">' + esc(w) + "</span>"; first = false; continue; }
      out += esc(w); first = false;
    }
    return out + (com ? '<span class="sh-com">' + esc(com) + "</span>" : "");
  };
  doc.querySelectorAll("pre").forEach(function (pre) {
    if (pre.className || pre.children.length || pre.closest(".mermaid-container")) return;
    var lines = pre.textContent.split("\n"), html = [], heredoc = null;
    lines.forEach(function (l) {
      if (heredoc) { html.push(esc(l)); if (l.trim() === heredoc) heredoc = null; return; }
      var h = l.match(/<<-?\s*'?"?([A-Za-z_]+)'?"?/);
      html.push(shLine(l));
      if (h) heredoc = h[1];
    });
    pre.innerHTML = html.join("\n");
  });

  // Coloration des blocs XML sans balisage (fichiers *-site.xml, pom.xml)
  doc.querySelectorAll("pre.xml").forEach(function (pre) {
    if (pre.children.length) return;
    var src = pre.textContent, out = "", re = /(<!--[\s\S]*?-->)|(<\/?)([\w:.-]+)((?:\s+[\w:.-]+="[^"]*")*)(\s*\/?\??>)|(<\?)([\w]+)((?:\s+[\w:.-]+="[^"]*")*)(\s*\?>)/g, last = 0, m;
    var attrs = function (a) {
      return esc(a).replace(/([\w:.-]+)=(&quot;|")([^"]*?)(&quot;|")/g, '<span class="xml-attr">$1</span>=<span class="xml-str">"$3"</span>');
    };
    while ((m = re.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += '<span class="xml-com">' + esc(m[1]) + "</span>";
      else if (m[2]) out += esc(m[2]) + '<span class="xml-tag">' + m[3] + "</span>" + attrs(m[4] || "") + esc(m[5]);
      else out += esc(m[6]) + '<span class="xml-tag">' + m[7] + "</span>" + attrs(m[8] || "") + esc(m[9]);
      last = re.lastIndex;
    }
    pre.innerHTML = out + esc(src.slice(last));
  });

  // Blocs de code : étiquette + bouton Copier
  var langOf = function (pre) {
    var c = pre.querySelector("code[class*='language-']");
    var m = c && c.className.match(/language-([a-z0-9]+)/i);
    if (m) return m[1] === "markup" ? "xml" : m[1];
    if (pre.classList.contains("xml")) return "xml";
    if (pre.classList.contains("java")) return "java";
    if (pre.classList.contains("python")) return "python";
    if (pre.classList.contains("yaml")) return "yaml";
    if (pre.classList.contains("plain")) return "texte";
    return "shell";
  };
  doc.querySelectorAll("pre").forEach(function (pre) {
    if (pre.classList.contains("mermaid") || pre.closest(".mermaid-container")) return;
    var wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var tools = document.createElement("div");
    tools.className = "code-tools";
    var lang = document.createElement("span");
    lang.className = "code-lang";
    lang.textContent = langOf(pre);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copier";
    btn.addEventListener("click", function () {
      var txt = pre.innerText.replace(/\s+$/, "") + "\n";
      var done = function () {
        btn.textContent = "Copié ✓";
        btn.classList.add("ok");
        setTimeout(function () { btn.textContent = "Copier"; btn.classList.remove("ok"); }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(txt).then(done, function () { fallback(txt); done(); });
      } else { fallback(txt); done(); }
    });
    tools.appendChild(lang);
    tools.appendChild(btn);
    wrap.appendChild(tools);
  });

  function fallback(txt) {
    var ta = document.createElement("textarea");
    ta.value = txt;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }
})();
