(function () {
  var TOPIC_IDS = {federated:1, async:1, muon:1, llm:1, broximal:1, first:1, second:1, zero:1, stochastic:1, local:1, momentum:1, compressed:1, convex:1, nonconvex:1, "primal-dual":1, "coordinate-descent":1, "error-feedback":1, lora:1, adaptive:1, proximal:1, sketching:1, "variance-reduction":1, acceleration:1, decentralized:1, privacy:1, "linear-algebra":1, minimax:1};
  var currentTopics = [];
  var currentYear = "";
  var currentQuery = "";
  var yearReady = false;

  function fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function assignPaperYears() {
    if (yearReady) return;
    var root = document.querySelector("#content.papers");
    if (!root) return;
    var y = "";
    for (var el = root.firstElementChild; el; el = el.nextElementSibling) {
      if (el.tagName === "H2" && el.id && el.id.indexOf("y") === 0) {
        y = el.id.slice(1);
      } else if (el.classList && el.classList.contains("paper")) {
        el.setAttribute("data-year", y);
      }
    }
    yearReady = true;
  }

  function parseHash() {
    var h = (location.hash || "").replace(/^#/, "");
    var year = "", topics = [], q = "";
    if (!h) return { year: "", topics: topics, q: q };
    h.split("&").forEach(function (part) {
      var i = part.indexOf("=");
      if (i === -1) return;
      var k = part.slice(0, i);
      var v = decodeURIComponent(part.slice(i + 1));
      if (k === "year" && v && v !== "all") year = v;
      if (k === "q") q = v;
      if (k === "topic") {
        v.split(",").forEach(function (raw) {
          var id = raw.toLowerCase().replace(/\+/g, " ").trim();
          if (id && id !== "all" && TOPIC_IDS[id] && topics.indexOf(id) === -1) topics.push(id);
        });
      }
    });
    var known = {};
    document.querySelectorAll(".year-jump a[data-year]").forEach(function (a) {
      var y = a.getAttribute("data-year") || "";
      if (y) known[y] = 1;
    });
    if (year && !known[year]) year = "";
    return { year: year, topics: topics, q: q };
  }

  function setHash() {
    var parts = [];
    if (currentYear) parts.push("year=" + encodeURIComponent(currentYear));
    if (currentTopics.length) parts.push("topic=" + currentTopics.join(","));
    if (currentQuery) parts.push("q=" + encodeURIComponent(currentQuery));
    var hashed = parts.length ? "#" + parts.join("&") : "";
    var next = hashed || (location.pathname + location.search);
    var cur = location.hash || "";
    if (hashed === cur) return;
    try { history.replaceState(null, "", next); } catch (e) {}
  }

  function applyFilters(updateHash) {
    assignPaperYears();
    document.querySelectorAll(".year-jump a").forEach(function (a) {
      var y = a.getAttribute("data-year") || "";
      if (y === currentYear) a.classList.add("is-active");
      else a.classList.remove("is-active");
    });
    document.querySelectorAll(".topic-jump a").forEach(function (a) {
      var t = a.getAttribute("data-topic") || "";
      var on = t ? (currentTopics.indexOf(t) !== -1) : (currentTopics.length === 0);
      if (on) a.classList.add("is-active");
      else a.classList.remove("is-active");
    });
    var qFold = fold(currentQuery).trim();
    document.querySelectorAll(".paper").forEach(function (p) {
      var okTopic = true;
      if (currentTopics.length) {
        var topics = (p.getAttribute("data-topics") || "").split(/\s+/).filter(Boolean);
        for (var i = 0; i < currentTopics.length; i++) {
          if (topics.indexOf(currentTopics[i]) === -1) { okTopic = false; break; }
        }
      }
      var okYear = !currentYear || (p.getAttribute("data-year") || "") === currentYear;
      var okQuery = !qFold || fold(p.textContent).indexOf(qFold) !== -1;
      p.hidden = !(okTopic && okYear && okQuery);
    });
    document.querySelectorAll("#content.papers h2[id^='y']").forEach(function (h2) {
      var vis = false;
      var el = h2.nextElementSibling;
      while (el && el.tagName !== "H2") {
        if (el.classList && el.classList.contains("paper") && !el.hidden) {
          vis = true;
          break;
        }
        el = el.nextElementSibling;
      }
      h2.hidden = !vis;
      var prev = h2.previousElementSibling;
      if (prev && (prev.classList.contains("news-rule") || prev.tagName === "HR")) {
        prev.hidden = !vis;
      }
    });
    var box = document.querySelector("details.paper-filters");
    if (box && (currentTopics.length || currentYear)) box.open = true;
    var inp = document.getElementById("paper-q");
    if (inp && inp.value !== currentQuery) inp.value = currentQuery;
    if (updateHash) setHash();
  }

  function onFilterClick(ev) {
    var yearA = ev.target.closest(".year-jump a[data-year]");
    var topicA = ev.target.closest(".topic-jump a[data-topic]");
    if (!yearA && !topicA) return;
    ev.preventDefault();
    if (yearA) {
      var y = yearA.getAttribute("data-year") || "";
      currentYear = (y && y === currentYear) ? "" : y;
    }
    if (topicA) {
      var id = topicA.getAttribute("data-topic") || "";
      if (!id) {
        currentTopics = [];
      } else {
        var i = currentTopics.indexOf(id);
        if (i === -1) currentTopics.push(id);
        else currentTopics.splice(i, 1);
      }
    }
    applyFilters(true);
  }

  var ACCENTS = {
    "á": "\\'{a}", "à": "\\`{a}", "â": "\\^{a}", "ä": "\\\"{a}", "ã": "\\~{a}", "å": "\\r{a}",
    "é": "\\'{e}", "è": "\\`{e}", "ê": "\\^{e}", "ë": "\\\"{e}",
    "í": "\\'{i}", "ì": "\\`{i}", "î": "\\^{i}", "ï": "\\\"{i}",
    "ó": "\\'{o}", "ò": "\\`{o}", "ô": "\\^{o}", "ö": "\\\"{o}", "õ": "\\~{o}",
    "ú": "\\'{u}", "ù": "\\`{u}", "û": "\\^{u}", "ü": "\\\"{u}",
    "ý": "\\'{y}", "č": "\\v{c}", "ć": "\\'{c}", "ň": "\\v{n}", "ř": "\\v{r}",
    "š": "\\v{s}", "ť": "\\v{t}", "ž": "\\v{z}", "ł": "\\l{}", "ø": "\\o{}",
    "Á": "\\'{A}", "É": "\\'{E}", "Í": "\\'{I}", "Ó": "\\'{O}", "Ú": "\\'{U}",
    "Č": "\\v{C}", "Š": "\\v{S}", "Ž": "\\v{Z}", "Ř": "\\v{R}", "Ń": "\\'{N}"
  };

  function texEscape(s) {
    s = String(s || "");
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ACCENTS[ch]) out += ACCENTS[ch];
      else if (ch === "\\") out += "\\textbackslash{}";
      else if ("&%$#_{}".indexOf(ch) !== -1) out += "\\" + ch;
      else if (ch === "–" || ch === "—") out += "--";
      else out += ch;
    }
    return out;
  }

  function asciiKey(s) {
    return fold(s).replace(/[^a-z0-9]+/g, "");
  }

  function splitAuthors(line) {
    line = String(line || "").replace(/^\s*\[\d+\]\s*/, "").replace(/\s+/g, " ").trim();
    if (!line) return [];
    line = line.replace(/,?\s+and\s+/gi, ", ");
    return line.split(/\s*,\s*/).map(function (n) { return n.trim(); }).filter(Boolean);
  }

  function authorBib(name) {
    var parts = name.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return texEscape(name);
    return texEscape(parts[parts.length - 1]) + ", " + texEscape(parts.slice(0, -1).join(" "));
  }

  function paperAuthorsLine(p) {
    var clone = p.cloneNode(true);
    clone.querySelectorAll("b, .algorithms, a, script, .chip").forEach(function (n) { n.remove(); });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function venueYear(text, fallback) {
    var m = String(text || "").match(/\b(19|20)\d{2}\b/g);
    if (m && m.length) return m[m.length - 1];
    return fallback || "";
  }

  function firstTitleWord(title) {
    var words = String(title || "").replace(/[^A-Za-z0-9\s]/g, " ").split(/\s+/);
    var skip = { the:1, a:1, an:1, on:1, of:1, for:1, and:1, to:1, in:1, from:1 };
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w && w.length > 2 && !skip[w.toLowerCase()]) return w.toLowerCase();
    }
    return "paper";
  }

  function generateBibtex(p) {
    var titleEl = p.querySelector("b");
    var title = titleEl ? titleEl.textContent.trim() : "";
    var authors = splitAuthors(paperAuthorsLine(p));
    var venueA = null;
    p.querySelectorAll("a").forEach(function (a) {
      if (venueA) return;
      if (a.classList.contains("chip") || a.classList.contains("chip-bibtex")) return;
      venueA = a;
    });
    var venue = venueA ? venueA.textContent.replace(/\s+/g, " ").trim() : "";
    var venueUrl = venueA ? venueA.getAttribute("href") || "" : "";
    var arxiv = "";
    var doi = "";
    var url = "";
    p.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var abs = href.match(/arxiv\.org\/abs\/([0-9]+\.[0-9]+)/i);
      if (abs && !arxiv) { arxiv = abs[1]; url = href; }
      var dm = href.match(/doi\.org\/(10\.\S+)/i);
      if (dm && !doi) doi = dm[1].replace(/\/$/, "");
      if (!url && /openreview\.net|jmlr\.org|pmlr\.press/i.test(href) && !a.classList.contains("chip")) url = href;
    });
    var year = venueYear(venue, p.getAttribute("data-year") || "");
    if (!year && arxiv) year = "20" + arxiv.slice(0, 2);
    var firstLast = authors[0] ? authors[0].split(/\s+/).pop() : "Richtarik";
    var key = asciiKey(firstLast) + year + asciiKey(firstTitleWord(title));
    var isConf = /ICML|NeurIPS|NIPS|ICLR|AISTATS|UAI|AAAI|COLT|ICCOPT|ISMP|conference|workshop|proceedings/i.test(venue);
    var isJour = /Journal|JMLR|TMLR|SIAM|Transactions|Optimization Letters|Mathematical Programming|Math\. Prog|JOTA|OMS /i.test(venue);
    var typ = "misc";
    if (isJour) typ = "article";
    else if (isConf) typ = "inproceedings";
    var lines = ["@" + typ + "{" + key + ","];
    lines.push("  title = {" + texEscape(title) + "},");
    if (authors.length) {
      lines.push("  author = {" + authors.map(authorBib).join(" and ") + "},");
    }
    if (year) lines.push("  year = {" + year + "},");
    if (typ === "article" && venue) lines.push("  journal = {" + texEscape(venue) + "},");
    if (typ === "inproceedings" && venue) lines.push("  booktitle = {" + texEscape(venue) + "},");
    if (typ === "misc" && venue) lines.push("  howpublished = {" + texEscape(venue) + "},");
    if (typ === "misc" && !venue && arxiv) lines.push("  howpublished = {arXiv preprint arXiv:" + arxiv + "},");
    if (doi) lines.push("  doi = {" + doi + "},");
    if (arxiv) {
      lines.push("  eprint = {" + arxiv + "},");
      lines.push("  archivePrefix = {arXiv},");
    }
    if (url) lines.push("  url = {" + url + "}");
    else if (arxiv) lines.push("  url = {https://arxiv.org/abs/" + arxiv + "}");
    if (lines[lines.length - 1].slice(-1) === ",") {
      /* ok */
    } else if (!lines[lines.length - 1].endsWith(",")) {
      /* last field already without comma is fine */
    }
    lines.push("}");
    // commas between fields
    for (var i = 1; i < lines.length - 1; i++) {
      if (lines[i].slice(-1) !== ",") lines[i] += ",";
    }
    return lines.join("\n") + "\n";
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { window.prompt("Copy BibTeX:", text); }
    document.body.removeChild(ta);
  }

  function copyBib(text, chip) {
    var prev = chip.textContent;
    function ok() {
      chip.textContent = "copied";
      setTimeout(function () { chip.textContent = prev; }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(function () { fallbackCopy(text); ok(); });
    } else {
      fallbackCopy(text);
      ok();
    }
  }

  function onBibClick(ev) {
    var chip = ev.target.closest("a.chip-bibtex");
    if (!chip) return;
    ev.preventDefault();
    var paper = chip.closest(".paper");
    if (!paper) return;
    var href = chip.getAttribute("href") || "";
    if (/\.bib(\?|#|$)/i.test(href) && href !== "#") {
      fetch(href).then(function (r) { return r.text(); }).then(function (t) {
        copyBib(t, chip);
      }).catch(function () {
        copyBib(generateBibtex(paper), chip);
      });
      return;
    }
    copyBib(generateBibtex(paper), chip);
  }

  function addBibtexChips() {
    document.querySelectorAll(".paper").forEach(function (p) {
      var existing = p.querySelector("a.chip[href$='.bib']");
      if (existing) {
        existing.classList.add("chip-bibtex");
        if (existing.textContent.trim().toLowerCase() === "bib") existing.textContent = "BibTeX";
        return;
      }
      if (p.querySelector("a.chip-bibtex")) return;
      var a = document.createElement("a");
      a.className = "chip chip-bibtex";
      a.href = "#";
      a.textContent = "BibTeX";
      var chips = p.querySelectorAll("a.chip");
      if (chips.length) {
        chips[chips.length - 1].after(document.createTextNode(" "), a);
      } else {
        // No other chips: give BibTeX its own line, like the chip row on other papers.
        var alg = p.querySelector(".algorithms");
        if (alg) {
          alg.before(a, document.createElement("br"));
        } else {
          var brs = p.querySelectorAll(":scope > br");
          if (brs.length >= 2) {
            brs[brs.length - 2].after(a, document.createElement("br"));
          } else {
            p.appendChild(a);
          }
        }
      }
    });
  }

  document.addEventListener("click", onFilterClick);
  document.addEventListener("click", onBibClick);
  window.addEventListener("hashchange", function () {
    var parsed = parseHash();
    currentYear = parsed.year;
    currentTopics = parsed.topics;
    currentQuery = parsed.q;
    applyFilters(false);
  });

  var search = document.getElementById("paper-q");
  if (search) {
    search.addEventListener("input", function () {
      currentQuery = search.value;
      applyFilters(true);
    });
  }

  addBibtexChips();
  var initial = parseHash();
  currentYear = initial.year;
  currentTopics = initial.topics;
  currentQuery = initial.q;
  applyFilters(false);
})();
