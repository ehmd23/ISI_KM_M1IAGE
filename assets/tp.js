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
  var shBlock = function (text) {
    var html = [], heredoc = null;
    text.split("\n").forEach(function (l) {
      if (heredoc) { html.push(esc(l)); if (l.trim() === heredoc) heredoc = null; return; }
      var h = l.match(/<<-?\s*'?"?([A-Za-z_]+)'?"?/);
      html.push(shLine(l));
      if (h) heredoc = h[1];
    });
    return html.join("\n");
  };

  // SQL / HiveQL
  var SQL_KW = ("SELECT FROM WHERE GROUP BY ORDER HAVING LIMIT AS AND OR NOT IN IS NULL LIKE BETWEEN CASE WHEN THEN ELSE END " +
    "DISTINCT JOIN LEFT RIGHT INNER OUTER FULL ON UNION ALL ASC DESC CREATE EXTERNAL TABLE DATABASE SCHEMA IF EXISTS USE DROP " +
    "ALTER INSERT INTO OVERWRITE VALUES LOAD DATA INPATH PARTITION PARTITIONED ROW FORMAT DELIMITED FIELDS TERMINATED LINES " +
    "STORED TEXTFILE PARQUET ORC LOCATION DESCRIBE SHOW DATABASES TABLES SET WITH").split(" ");
  var SQL_TYPE = "STRING INT INTEGER BIGINT SMALLINT TINYINT DOUBLE FLOAT DECIMAL BOOLEAN DATE TIMESTAMP VARCHAR CHAR".split(" ");
  var SQL_FN = "SUM AVG COUNT MIN MAX ROUND UPPER LOWER SUBSTR CONCAT COALESCE CAST YEAR MONTH DAY TO_DATE".split(" ");
  var sqlBlock = function (text) {
    var out = "", m, re = /(--[^\n]*)|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(\s*\()?|([(),;.*=<>!]+)|(\s+|.)/g;
    while ((m = re.exec(text)) !== null) {
      if (m[1]) out += '<span class="sql-com">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="sql-str">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="sql-num">' + m[3] + "</span>";
      else if (m[4]) {
        var U = m[4].toUpperCase(), paren = m[5] || "";
        if (SQL_FN.indexOf(U) !== -1 && paren) out += '<span class="sql-fn">' + esc(m[4]) + "</span>" + esc(paren);
        else if (SQL_KW.indexOf(U) !== -1) out += '<span class="sql-kw">' + esc(m[4]) + "</span>" + esc(paren);
        else if (SQL_TYPE.indexOf(U) !== -1) out += '<span class="sql-type">' + esc(m[4]) + "</span>" + esc(paren);
        else out += esc(m[4]) + esc(paren);
      }
      else if (m[6]) out += '<span class="sql-op">' + esc(m[6]) + "</span>";
      else out += esc(m[7]);
    }
    return out;
  };

  // Outils communs : chaîne, nombre, variable ${...}
  var span = function (cls, t) { return '<span class="' + cls + '">' + esc(t) + "</span>"; };
  var valueHL = function (v) {
    var t = v.trim();
    if (/^-?\d+(\.\d+)?$/.test(t) || /^(true|false|yes|no|null)$/i.test(t)) return v.replace(t, span("tk-num", t));
    var out = "", m, re = /("(?:[^"\\]|\\.)*"|'[^']*')|(\$\{?[A-Za-z_][A-Za-z0-9_.]*\}?)|([^"'$]+|.)/g;
    while ((m = re.exec(v)) !== null) {
      if (m[1]) out += span("tk-str", m[1]);
      else if (m[2]) out += span("tk-var", m[2]);
      else out += esc(m[3]);
    }
    return out;
  };
  var splitComment = function (line, marks) {
    var inS = null;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inS) { if (ch === inS) inS = null; continue; }
      if (ch === '"' || ch === "'") { inS = ch; continue; }
      if (marks.indexOf(ch) !== -1 && (i === 0 || /\s/.test(line[i - 1]))) return [line.slice(0, i), line.slice(i)];
    }
    return [line, ""];
  };

  // YAML (docker-compose.yml, netplan)
  var yamlBlock = function (text) {
    var block = -1;
    return text.split("\n").map(function (l) {
      var ind = l.match(/^\s*/)[0].length;
      if (block >= 0) { if (l.trim() === "" || ind > block) return span("tk-str", l); block = -1; }
      var parts = splitComment(l, "#"), body = parts[0], com = parts[1] ? span("tk-com", parts[1]) : "";
      var m = body.match(/^(\s*)(-\s+)?([\w.\-]+)(:)(?=\s|$)(\s*)(.*)$/);
      if (m) {
        var v = m[6];
        if (/^[>|][+-]?\s*$/.test(v)) { block = ind + (m[2] ? m[2].length : 0); return m[1] + (m[2] ? span("tk-op", m[2]) : "") + span("tk-key", m[3]) + span("tk-op", m[4]) + m[5] + span("tk-op", v) + com; }
        return m[1] + (m[2] ? span("tk-op", m[2]) : "") + span("tk-key", m[3]) + span("tk-op", m[4]) + m[5] + valueHL(v) + com;
      }
      var d = body.match(/^(\s*)(-\s+)(.*)$/);
      if (d) return d[1] + span("tk-op", d[2]) + valueHL(d[3]) + com;
      return valueHL(body) + com;
    }).join("\n");
  };

  // INI (hue.ini)
  var iniBlock = function (text) {
    return text.split("\n").map(function (l) {
      if (/^\s*[#;]/.test(l)) return span("tk-com", l);
      var sec = l.match(/^(\s*)(\[+[^\]]*\]+)(\s*)$/);
      if (sec) return sec[1] + span("tk-sec", sec[2]) + sec[3];
      var kv = l.match(/^(\s*)([\w.\-]+)(\s*=\s*)(.*)$/);
      if (kv) return kv[1] + span("tk-key", kv[2]) + span("tk-op", kv[3]) + valueHL(kv[4]);
      return esc(l);
    }).join("\n");
  };

  // Dockerfile
  var DOCKER_INS = "FROM RUN ADD COPY USER ARG ENV WORKDIR CMD ENTRYPOINT EXPOSE LABEL VOLUME HEALTHCHECK SHELL ONBUILD STOPSIGNAL".split(" ");
  var dockerBlock = function (text) {
    var cont = false;
    return text.split("\n").map(function (l) {
      if (/^\s*#/.test(l)) { cont = false; return span("tk-com", l); }
      var out, m = l.match(/^(\s*)([A-Za-z]+)(\s+)(.*)$/);
      if (!cont && m && DOCKER_INS.indexOf(m[2].toUpperCase()) !== -1) {
        var rest = m[4];
        if (m[2].toUpperCase() === "RUN") out = m[1] + span("tk-kw", m[2]) + m[3] + shLine(rest);
        else out = m[1] + span("tk-kw", m[2]) + m[3] + valueHL(rest).replace(/(\s|^)(--?[A-Za-z][\w-]*)/g, '$1<span class="tk-num">$2</span>');
      } else out = cont ? shLine(l) : esc(l);
      cont = /\\\s*$/.test(l);
      return out;
    }).join("\n");
  };

  // Java
  var JAVA_KW = ("package import public private protected static final class interface extends implements new return if else for while " +
    "do switch case default break continue try catch finally throw throws void int long double float boolean char byte short " +
    "this super null true false abstract synchronized var instanceof").split(" ");
  var javaBlock = function (text) {
    var out = "", m, re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)')|(@[A-Za-z]+)|(\b\d+(?:\.\d+)?[dDfFlL]?\b)|([A-Za-z_][A-Za-z0-9_]*)(?=(\s*\())?|([{}()\[\];,.<>=+\-*\/!&|?:]+)|(\s+|.)/g;
    while ((m = re.exec(text)) !== null) {
      if (m[1]) out += span("tk-com", m[1]);
      else if (m[2]) out += span("tk-str", m[2]);
      else if (m[3]) out += span("tk-var", m[3]);
      else if (m[4]) out += span("tk-num", m[4]);
      else if (m[5]) {
        var w = m[5];
        if (JAVA_KW.indexOf(w) !== -1) out += span("tk-kw", w);
        else if (m[6] && /^[a-z]/.test(w)) out += span("tk-fn", w);
        else if (/^[A-Z]/.test(w)) out += span("tk-type", w);
        else out += esc(w);
      }
      else if (m[7]) out += span("tk-op", m[7]);
      else out += esc(m[8]);
    }
    return out;
  };

  var applyHL = function (sel, fn, lang) {
    doc.querySelectorAll(sel).forEach(function (el) {
      var pre = el.tagName === "PRE" ? el : el.parentNode;
      if (el.tagName === "PRE" && el.children.length) return;
      el.innerHTML = fn(el.textContent);
      if (el.tagName === "CODE") el.className = "hl-" + lang;
      pre.dataset.lang = lang;
    });
  };
  applyHL("pre.yaml, pre > code.language-yaml, pre > code.language-yml", yamlBlock, "yaml");
  applyHL("pre > code.language-ini", iniBlock, "ini");
  applyHL("pre > code.language-dockerfile, pre > code.language-docker", dockerBlock, "dockerfile");
  applyHL("pre > code.language-java", javaBlock, "java");

  // Blocs shell sans classe (TP1/TP2)
  doc.querySelectorAll("pre").forEach(function (pre) {
    if (pre.className || pre.children.length || pre.closest(".mermaid-container")) return;
    pre.innerHTML = shBlock(pre.textContent);
    pre.dataset.lang = "shell";
  });
  // Blocs bash et SQL balisés (TP3/TP4) : coloration maison, Prism ne les retouche pas
  doc.querySelectorAll("pre > code.language-bash, pre > code.language-sh, pre > code.language-sql").forEach(function (code) {
    var isSql = code.classList.contains("language-sql");
    var txt = code.textContent;
    code.innerHTML = isSql ? sqlBlock(txt) : shBlock(txt);
    code.className = isSql ? "hl-sql" : "hl-sh";
    code.parentNode.dataset.lang = isSql ? "sql" : "shell";
  });

  // Coloration des blocs XML sans balisage (fichiers *-site.xml, pom.xml)
  doc.querySelectorAll("pre.xml, pre > code.language-markup, pre > code.language-xml").forEach(function (pre) {
    if (pre.tagName === "PRE" && pre.children.length) return;
    if (pre.tagName === "CODE") { pre.parentNode.classList.add("xml"); pre.parentNode.dataset.lang = "xml"; pre.className = "hl-xml"; }
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
    if (pre.dataset.lang) return pre.dataset.lang;
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
