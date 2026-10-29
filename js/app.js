(function () {
  var HT = window.HT || { root: "", page: "content" };
  var PAGE_SIZE = 60;
  var MODELS = [
    ["", "全部模型"],
    ["Claude", "Claude"],
    ["Gemini", "Gemini"],
    ["Grok", "Grok"],
    ["OpenAI", "GPT"],
    ["其他国产", "其他国产"]
  ];
  var PAYS = [
    ["", "全部支付"],
    ["USDT", "USDT"],
    ["VISA", "VISA"],
    ["微信", "微信"],
    ["支付宝", "支付宝"]
  ];
  var TAGS = [
    ["", "全部标签"],
    ["精选", "精选"],
    ["新用户赠金", "新用户赠金"],
    ["邀请赠金", "邀请赠金"]
  ];
  var SORTS = [
    ["default", "默认"],
    ["uptime", "可用率"],
    ["price", "起充"],
    ["name", "名称"]
  ];
  var AMBER = { "精选": 1, "新用户赠金": 1, "邀请赠金": 1, "A 社名单": 1 };
  var STATUS = {
    ok: { label: "今日可用", detail: "近期可用", dot: "bg-emerald-500 dark:bg-emerald-400" },
    error: { label: "响应异常", detail: "检测异常", dot: "bg-amber-500 dark:bg-amber-400" },
    down: { label: "无法访问", detail: "无法访问", dot: "bg-red-500 dark:bg-red-400" }
  };
  var MODEL_META = {
    OpenAI: { label: "OpenAI", icon: "GPT.svg", invert: true },
    Claude: { label: "Claude", icon: "claude.svg" },
    Gemini: { label: "Gemini", icon: "gemini.svg" },
    Grok: { label: "Grok", icon: "grok.svg" },
    "其他国产": { label: "国产" },
    "视频生成": { label: "视频生成" }
  };
  var PAGES = [
    ["模型榜", "models/index.html"],
    ["价格对比", "price/claude-opus-5/index.html"],
    ["Claude 中转站", "claude/index.html"],
    ["GPT 中转站", "openai/index.html"],
    ["Gemini 中转站", "gemini/index.html"],
    ["Grok 中转站", "grok/index.html"],
    ["国产大模型", "domestic/index.html"],
    ["Codex", "codex/index.html"],
    ["新用户赠金", "free/index.html"],
    ["支付宝", "alipay/index.html"],
    ["微信支付", "wechat/index.html"],
    ["USDT", "usdt/index.html"],
    ["VISA", "visa/index.html"],
    ["便宜好用的 Claude", "best-claude-relay/index.html"],
    ["便宜的 GPT", "cheap-gpt-api/index.html"],
    ["渠道科普", "guides/channels/index.html"],
    ["选站避雷", "guides/pitfalls/index.html"],
    ["模型真假检测", "verify/index.html"],
    ["额度重置", "resets/index.html"],
    ["关于本站", "about/index.html"],
    ["博客", "blog/index.html"],
    ["投稿收录", "submit/index.html"],
    ["广告合作", "advertise/index.html"],
    ["隐私政策", "privacy/index.html"]
  ];

  var state = {
    q: "",
    model: (HT.filter && HT.filter.model) || "",
    pay: (HT.filter && HT.filter.pay) || "",
    tag: (HT.filter && HT.filter.tag) || "",
    sort: HT.sort || "default",
    shown: PAGE_SIZE,
    codex: !!(HT.filter && HT.filter.codex)
  };
  var codexSet = null;
  if (window.CODEX && window.CODEX.length && window.CODEX.length < 700) {
    codexSet = {};
    window.CODEX.forEach(function (d) { codexSet[d] = 1; });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rootPath(path) {
    return (HT.root || "") + path;
  }
  function stationHref(s) {
    if (!s.slug) return "";
    return rootPath("station/" + s.slug + "/index.html");
  }
  function siteUrl(s) {
    if (s.url && /^https?:\/\//i.test(s.url)) return s.url;
    return "https://" + s.domain;
  }
  function statusOf(s) {
    return STATUS[s.status] || STATUS.ok;
  }
  function iconSrc(file) {
    return rootPath("assets/icons/" + file);
  }
  function stationIcon(domain, ext) {
    var name = String(domain || "").replace(/[<>:"/\\|?*]/g, "_");
    return rootPath("assets/station-icons/" + name + "." + ext);
  }
  function letterSrc(name) {
    var ch = String(name || "?").replace(/&nbsp;?/gi, "").trim().charAt(0) || "?";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="16" fill="#e6f3ec"/><text x="40" y="50" text-anchor="middle" font-size="32" font-family="sans-serif" fill="#0e7a53">' + ch.replace(/[&<>]/g, "") + "</text></svg>";
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }
  window.htIconErr = function (img) {
    if (img.dataset.step !== "png") {
      img.dataset.step = "png";
      img.src = stationIcon(img.getAttribute("data-domain"), "png");
      return;
    }
    img.onerror = null;
    img.src = letterSrc(img.getAttribute("data-name") || "?");
  };

  function matches(s) {
    if (state.model && (s.models || []).indexOf(state.model) < 0) return false;
    if (state.pay && (s.pays || []).indexOf(state.pay) < 0) return false;
    if (state.tag && (s.tags || []).indexOf(state.tag) < 0) return false;
    if (state.codex) {
      if (codexSet) {
        if (!codexSet[s.domain]) return false;
      } else {
        var blob = (s.name + " " + (s.desc || "") + " " + (s.base || "")).toLowerCase();
        if (blob.indexOf("codex") < 0) return false;
      }
    }
    if (state.q) {
      var q = state.q.toLowerCase();
      var hay = (s.name + " " + s.domain + " " + (s.desc || "") + " " + (s.models || []).join(" ") + " " + (s.pays || []).join(" ") + " " + (s.tags || []).join(" ")).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }
  function sortList(list) {
    var arr = list.slice();
    if (state.sort === "uptime") {
      arr.sort(function (a, b) { return (b.uptime || 0) - (a.uptime || 0) || a.order - b.order; });
    } else if (state.sort === "price") {
      arr.sort(function (a, b) {
        var ap = a.minRaw > 0 ? a.minRaw : 1e12;
        var bp = b.minRaw > 0 ? b.minRaw : 1e12;
        return ap - bp || a.order - b.order;
      });
    } else if (state.sort === "name") {
      arr.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), "zh-CN") || a.order - b.order; });
    } else if (HT.layout !== "home") {
      arr.sort(function (a, b) {
        var ap = a.pinned ? (a.rank || 99) : 1000;
        var bp = b.pinned ? (b.rank || 99) : 1000;
        if (ap !== bp) return ap - bp;
        return a.order - b.order;
      });
    }
    return arr;
  }
  function modelChips(models) {
    var list = models || [];
    var shown = list.slice(0, 3);
    var html = shown.map(function (m) {
      var meta = MODEL_META[m] || { label: m };
      var icon = meta.icon
        ? '<img src="' + iconSrc(meta.icon) + '" alt="' + esc(meta.label) + '" class="h-3.5 w-3.5 shrink-0' + (meta.invert ? " dark:invert" : "") + '"/>'
        : "";
      return '<span class="inline-flex items-center gap-1 rounded-md border border-border bg-surface-secondary px-1.5 py-0.5 text-[11px] text-muted">' + icon + esc(meta.label) + "</span>";
    }).join("");
    if (list.length > 3) {
      html += '<span class="cursor-help self-center text-[11px] text-muted/70" title="还有 ' + (list.length - 3) + " 个模型: " + esc(list.slice(3).join(", ")) + '">+' + (list.length - 3) + "</span>";
    }
    return html;
  }
  function payChips(pays) {
    return (pays || []).map(function (p) {
      return '<span class="rounded-md bg-surface-secondary px-1.5 py-0.5 text-[11px] text-muted">' + esc(p) + "</span>";
    }).join("");
  }
  function tagChips(tags) {
    return (tags || []).map(function (t) {
      if (AMBER[t]) {
        return '<span class="rounded-md border border-amber-400/40 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">' + esc(t) + "</span>";
      }
      return '<span class="rounded-md bg-surface-secondary px-1.5 py-0.5 text-[11px] text-muted">' + esc(t) + "</span>";
    }).join("");
  }
  function card(s, sponsored) {
    var st = statusOf(s);
    var border = sponsored
      ? "border-accent/60 ring-1 ring-accent/20"
      : "border-border hover:border-accent/40";
    var badge = sponsored
      ? '<span class="inline-flex shrink-0 items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">赞助</span>'
      : "";
    var desc = s.desc
      ? '<p class="line-clamp-2 text-xs leading-relaxed text-muted">' + esc(s.desc) + "</p>"
      : "";
    var detail = s.slug
      ? '<a href="' + stationHref(s) + '" class="flex-1 rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-strong">查看详情</a>'
      : "";
    return '<div class="group flex min-w-0 flex-col gap-3 rounded-2xl border bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ' + border + '">' +
      '<div class="flex items-start gap-3"><img src="' + stationIcon(s.domain, "webp") + '" alt="" width="40" height="40" data-domain="' + esc(s.domain) + '" data-name="' + esc(s.name) + '" onerror="htIconErr(this)" class="h-10 w-10 shrink-0 rounded-lg border border-border bg-white object-contain p-1" loading="lazy"/>' +
      '<div class="min-w-0 flex-1"><div class="flex items-center gap-1.5"><h3 class="truncate text-sm font-semibold text-foreground">' + esc(s.name) + "</h3>" + badge + "</div>" +
      '<p class="truncate text-xs text-muted">' + esc(s.domain) + "</p></div></div>" +
      desc +
      '<div class="flex flex-wrap gap-1.5">' + modelChips(s.models) + payChips(s.pays) + tagChips(s.tags) + "</div>" +
      '<div class="mt-auto flex flex-col gap-3"><div class="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted"><span class="h-2 w-2 shrink-0 rounded-full ' + st.dot + '"></span><span>' + st.label + " · 30 天可用率 " + esc(s.uptime) + "%</span></div>" +
      '<div class="flex gap-2">' + detail +
      '<a href="' + esc(siteUrl(s)) + '" target="_blank" rel="noopener noreferrer" class="flex-1 rounded-lg bg-accent px-3.5 py-2 text-center text-xs font-semibold text-white shadow-card transition-colors hover:bg-accent-strong">访问官网</a></div></div></div>';
  }
  function bannerHtml() {
    return '<a href="https://novaapi.ai/" target="_blank" rel="noopener sponsored" class="group relative hidden w-[380px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#f3c9b4] bg-[#fdf8f4] px-4 pb-3 pt-2.5 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover dark:border-[#3a4254] dark:bg-[#0c1220] lg:flex">' +
      '<div aria-hidden="true" class="absolute inset-y-0 left-0 w-[5px] bg-gradient-to-b from-[#f6a06b] via-[#ED7D50] to-[#f6a06b] dark:opacity-0"></div>' +
      '<div aria-hidden="true" class="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border-[14px] border-[#ED7D50]/10 dark:border-[#ED7D50]/15"></div>' +
      '<span aria-hidden="true" class="pointer-events-none absolute right-2 top-6 hidden select-none font-display text-6xl font-black text-white/[0.04] dark:block">AI</span>' +
      '<div class="relative flex items-start justify-between"><span class="flex items-center gap-1.5 font-display text-[15px] font-extrabold tracking-tight text-[#16181d] dark:text-[#f3f4f6]"><img src="' + stationIcon("novaapi.ai", "png") + '" alt="" class="h-5 w-5 object-contain"/>NovaAPI</span><span class="flex flex-col items-end gap-0.5"><span class="rounded-full border border-[#ED7D50]/50 px-2 py-px text-[9px] font-bold tracking-wider text-[#ED7D50]">赞 助</span><span class="border-b border-[#ED7D50]/60 text-[9px] font-semibold text-[#ED7D50]">novaapi.ai</span></span></div>' +
      '<div class="relative -mt-0.5"><p class="font-display text-[21px] font-black leading-none tracking-tight text-[#16181d] dark:text-white">首充赠送 100%</p><p class="mt-1 text-[15px] font-bold leading-none text-[#3a3f4b] dark:text-[#cdd3de]">次充省 15% · 邀请长期奖励</p><p class="mt-1.5 text-[10.5px] text-[#6b7280] dark:text-[#9aa4b2]">个人开发者 · 跨境 AI 团队 · 企业算力</p></div>' +
      '<div class="relative flex items-center gap-2"><div class="flex flex-1 items-center justify-between rounded-xl bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-black/[0.04] dark:bg-white/[0.06] dark:ring-white/10"><span class="flex flex-col"><span class="font-display text-[13.5px] font-extrabold leading-tight text-[#ED7D50]">100%</span><span class="text-[8.5px] text-[#6b7280] dark:text-[#9aa4b2]">首充赠送</span></span><span class="flex flex-col border-l border-black/10 pl-2.5 dark:border-white/10"><span class="font-display text-[13.5px] font-extrabold leading-tight text-[#ED7D50]">15%</span><span class="text-[8.5px] text-[#6b7280] dark:text-[#9aa4b2]">次充优惠</span></span><span class="flex flex-col border-l border-black/10 pl-2.5 dark:border-white/10"><span class="font-display text-[13.5px] font-extrabold leading-tight text-[#ED7D50]">长期</span><span class="text-[8.5px] text-[#6b7280] dark:text-[#9aa4b2]">邀请奖励</span></span></div><span class="inline-flex items-center whitespace-nowrap rounded-xl bg-gradient-to-b from-[#f08a5c] to-[#ED7D50] px-3.5 py-2.5 text-[12.5px] font-extrabold text-white shadow-md">立即领取 →</span></div>' +
      '<span aria-hidden="true" class="pointer-events-none absolute bottom-0.5 right-4 text-[8px] leading-none text-[#9aa4b2]/80 dark:text-[#6b7280]/80">以上数据为广告主自述</span></a>';
  }
  function chipRow(label, key, items) {
    return '<div class="flex flex-wrap items-center gap-2.5"><span class="w-9 shrink-0 text-[11px] font-medium text-muted/70">' + label + '</span><div class="flex flex-wrap gap-1.5">' +
      items.map(function (it) {
        return '<button type="button" data-chip data-key="' + key + '" data-value="' + esc(it[0]) + '">' + esc(it[1]) + "</button>";
      }).join("") + "</div></div>";
  }
  function sortLabel() {
    for (var i = 0; i < SORTS.length; i++) if (SORTS[i][0] === state.sort) return SORTS[i][1];
    return "默认";
  }
  function mountShell() {
    var host = document.getElementById("directory");
    if (!host) return;
    var banner = HT.layout === "home" ? bannerHtml() : "";
    host.innerHTML =
      '<div id="stations" class="stations-anchor"><div class="sticky-edge-fade sticky stations-sticky z-20 -mx-4 bg-background/90 px-4 pt-2 pb-3 backdrop-blur-md sm:-mx-6 sm:px-6">' +
      '<div class="flex items-stretch gap-4"><div class="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">' +
      '<div class="flex items-center gap-2"><label class="relative flex-1 sm:max-w-sm"><span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>' +
      '<input id="q" type="text" placeholder="搜索中转站、模型..." class="input-focus-glow h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-16 text-sm text-foreground shadow-card outline-none transition-colors placeholder:text-muted/70 focus:border-accent"/>' +
      '<span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"><kbd class="inline-flex h-6 items-center gap-0.5 rounded-md border border-border bg-gradient-to-b from-surface to-surface-secondary px-1.5 text-[10px] font-medium text-muted shadow-card"><abbr class="no-underline" title="Command">⌘</abbr>K</kbd></span></label>' +
      '<div class="relative"><button type="button" id="sort-btn" class="inline-flex h-12 items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 text-xs font-medium text-muted shadow-card transition-colors duration-150 ease-out hover:border-accent/40 hover:text-foreground"><span id="sort-label">排序: ' + esc(sortLabel()) + '</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></button>' +
      '<div id="sort-menu" class="sort-menu hidden rounded-xl border border-border bg-surface p-1 shadow-card">' +
      SORTS.map(function (s) {
        return '<button type="button" data-sort="' + s[0] + '" class="block w-full rounded-lg px-3 py-2 text-left text-xs text-muted hover:bg-surface-secondary hover:text-foreground">' + s[1] + "</button>";
      }).join("") + "</div></div></div>" +
      '<div><div class="mb-2 flex items-center justify-end sm:hidden"><button type="button" id="filter-toggle" class="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted shadow-card">展开筛选</button></div>' +
      '<div id="filters" class="filters hidden flex-col gap-2 sm:flex">' +
      chipRow("模型", "model", MODELS) + chipRow("支付", "pay", PAYS) + chipRow("标签", "tag", TAGS) +
      "</div></div></div>" + banner + "</div></div>" +
      '<section class="flex-1 pt-3" id="list-root"></section></div>';
    paintChips();
    document.getElementById("q").addEventListener("input", function (e) {
      state.q = e.target.value.trim();
      state.shown = PAGE_SIZE;
      renderLists();
    });
    document.getElementById("sort-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      document.getElementById("sort-menu").classList.toggle("hidden");
    });
    document.getElementById("sort-menu").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-sort]");
      if (!btn) return;
      state.sort = btn.getAttribute("data-sort");
      state.shown = PAGE_SIZE;
      document.getElementById("sort-label").textContent = "排序: " + sortLabel();
      document.getElementById("sort-menu").classList.add("hidden");
      renderLists();
    });
    document.getElementById("filter-toggle").addEventListener("click", function () {
      document.getElementById("filters").classList.toggle("is-open");
    });
    host.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-chip]");
      if (!chip) return;
      state[chip.getAttribute("data-key")] = chip.getAttribute("data-value");
      state.shown = PAGE_SIZE;
      paintChips();
      renderLists();
    });
    var more = document.getElementById("list-root");
    more.addEventListener("click", function (e) {
      if (e.target.id === "more") {
        state.shown += PAGE_SIZE;
        renderLists();
      }
    });
  }
  function paintChips() {
    document.querySelectorAll("[data-chip]").forEach(function (btn) {
      var on = state[btn.getAttribute("data-key")] === btn.getAttribute("data-value");
      btn.className = on
        ? "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ease-out chip-selected-glow scale-[1.03] bg-accent text-white"
        : "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ease-out border border-border bg-surface text-muted hover:border-accent/40 hover:text-foreground";
    });
  }
  function renderLists() {
    var root = document.getElementById("list-root");
    if (!root || !window.STATIONS) return;
    var all = window.STATIONS.filter(matches);
    var sponsors = [];
    var rest = all;
    if (HT.layout === "home") {
      sponsors = sortList(all.filter(function (s) { return s.pinned; })).sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); });
      rest = all.filter(function (s) { return !s.pinned; });
    }
    rest = sortList(rest);
    var n = rest.length;
    var slice = rest.slice(0, state.shown);
    var heading = HT.listLabel || "全部中转站";
    var html = "";
    if (HT.layout === "home" && sponsors.length) {
      html += '<div class="mb-8"><div class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 class="text-sm font-semibold text-foreground">赞助推荐</h2><p class="text-xs text-muted/70">付费展示位，价格与检测结果照常计算，不因赞助调整</p></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">' +
        sponsors.map(function (s) { return card(s, true); }).join("") + "</div></div>";
    } else if (HT.layout !== "home") {
      n = all.length;
      slice = sortList(all).slice(0, state.shown);
    }
    html += '<div class="mb-4 flex items-end justify-between"><h2 class="text-sm font-semibold text-foreground">' + esc(heading) +
      '<span class="ml-2 rounded-full bg-default px-2 py-0.5 text-xs font-normal text-muted">' + n + " / " + n + "</span></h2>" +
      '<p class="hidden text-xs text-muted/70 sm:block">请甄别服务商资质，建议小额测试后再充值</p></div>';
    if (!slice.length) {
      html += '<p class="py-16 text-center text-sm text-muted">没有找到匹配的中转站</p>';
    } else {
      html += '<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">' + slice.map(function (s) { return card(s, false); }).join("") + "</div>";
    }
    if (slice.length < (HT.layout === "home" ? rest.length : all.length)) {
      html += '<div class="mt-6 flex justify-center"><button type="button" id="more" class="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-muted shadow-card transition-colors hover:border-accent/40 hover:text-accent-strong">加载更多</button></div>';
    }
    root.innerHTML = html;
    var count = document.getElementById("list-count");
    if (count) count.textContent = String(HT.layout === "home" ? rest.length : all.length);
  }

  function factRow(k, v) {
    return '<tr class="border-b border-border last:border-0"><th class="w-28 bg-surface-secondary px-4 py-3 text-left font-medium text-muted">' + esc(k) + '</th><td class="px-4 py-3 text-foreground">' + v + "</td></tr>";
  }
  function longModel(name) {
    return ({ OpenAI: "OpenAI(GPT)", Claude: "Anthropic Claude", Gemini: "Google Gemini", Grok: "xAI Grok", "其他国产": "国产大模型" })[name] || name;
  }
  function moneyText(s) {
    var m = s.min || "";
    if (m.indexOf("$$") === 0) return "$" + m.slice(2);
    return m;
  }
  function stationCrumb(s) {
    var models = s.models || [];
    var order = [["Claude", "claude/index.html"], ["OpenAI", "openai/index.html"], ["Gemini", "gemini/index.html"], ["Grok", "grok/index.html"], ["其他国产", "domestic/index.html"]];
    for (var i = 0; i < order.length; i++) {
      if (models.indexOf(order[i][0]) >= 0) return order[i][1];
    }
    return "index.html";
  }
  function stationPros(s) {
    var items = [];
    var models = s.models || [];
    var pays = s.pays || [];
    if (models.length > 1) items.push("支持多家主流大模型,一个接口统一调用、随时切换");
    if (pays.indexOf("支付宝") >= 0 || pays.indexOf("微信") >= 0) {
      var bits = [];
      if (pays.indexOf("支付宝") >= 0) bits.push("支付宝");
      if (pays.indexOf("微信") >= 0) bits.push("微信");
      items.push("支持" + bits.join(" / ") + ",国内充值方便,无需海外卡");
    }
    if (pays.indexOf("USDT") >= 0) items.push("支持 USDT,海外用户与注重隐私者充值友好");
    if (pays.indexOf("VISA") >= 0) items.push("支持 VISA 信用卡支付");
    if ((s.tags || []).indexOf("新用户赠金") >= 0) items.push("新用户有赠金,可零成本先试用再决定");
    if ((s.tags || []).indexOf("精选") >= 0) items.push("HowToken 精选收录(基于收录时综合评估)");
    return items;
  }
  function fitText(s) {
    var models = s.models || [];
    if (models.length === 1 && models[0] === "视频生成") return "主要使用 视频生成模型、希望国内便捷充值调用的个人或团队。";
    if (models.length <= 1) return "主要使用 " + longModel(models[0] || "该站模型") + "、希望用人民币直接调用的开发者。";
    return "需要同时用到 " + models.slice(0, 3).map(longModel).join("、") + " 等多家模型、希望一个账户统一管理的开发者。";
  }
  function shareModel(a, b) {
    var models = a.models || [];
    var other = b.models || [];
    for (var i = 0; i < models.length; i++) {
      if (other.indexOf(models[i]) >= 0) return true;
    }
    return false;
  }
  function relatedStations(s) {
    var same = [];
    var rest = [];
    (window.STATIONS || []).forEach(function (other) {
      if (!other.slug || other.slug === s.slug) return;
      (shareModel(s, other) ? same : rest).push(other);
    });
    return same.concat(rest).slice(0, 3);
  }
  function relatedCard(s) {
    var border = s.pinned ? "border-accent/60 ring-1 ring-accent/20" : "border-border hover:border-accent/40";
    var desc = s.desc ? '<p class="line-clamp-2 text-xs leading-relaxed text-muted">' + esc(s.desc) + "</p>" : "";
    return '<div class="group flex min-w-0 flex-col gap-3 rounded-2xl border bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ' + border + '">' +
      '<div class="flex items-start gap-3"><img src="' + stationIcon(s.domain, "webp") + '" alt="" width="40" height="40" data-domain="' + esc(s.domain) + '" data-name="' + esc(s.name) + '" onerror="htIconErr(this)" class="h-10 w-10 shrink-0 rounded-lg border border-border bg-white object-contain p-1" loading="lazy"/>' +
      '<div class="min-w-0 flex-1"><h3 class="truncate text-sm font-semibold text-foreground">' + esc(s.name) + '</h3><p class="truncate text-xs text-muted">' + esc(s.domain) + "</p></div></div>" +
      desc +
      '<div class="flex flex-wrap gap-1.5">' + modelChips(s.models) + payChips(s.pays) + tagChips(s.tags) + "</div>" +
      '<div class="mt-auto flex gap-2"><a href="' + stationHref(s) + '" class="flex-1 rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-strong">查看详情</a>' +
      '<a href="' + esc(siteUrl(s)) + '" target="_blank" rel="noopener noreferrer" class="flex-1 rounded-lg bg-accent px-3.5 py-2 text-center text-xs font-semibold text-white shadow-card transition-colors hover:bg-accent-strong">访问官网</a></div></div>';
  }
  function renderStation() {
    var host = document.getElementById("detail");
    if (!host || !window.STATIONS) return;
    var s = null;
    for (var i = 0; i < window.STATIONS.length; i++) {
      if (window.STATIONS[i].slug === HT.slug) { s = window.STATIONS[i]; break; }
    }
    if (!s) {
      host.innerHTML = '<p class="text-sm text-muted">没有找到这个中转站。</p>';
      return;
    }
    document.title = s.name + " 怎么样?中转站评测、价格与支持模型 - HowToken";
    var st = statusOf(s);
    var models = s.models || [];
    var pays = s.pays || [];
    var tags = s.tags || [];
    var longs = models.map(longModel);
    var gift = tags.indexOf("新用户赠金") >= 0 ? "有" : "—";
    var shownMin = moneyText(s);
    var tone = s.status === "down" ? "text-red-600 dark:text-red-400" : s.status === "error" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
    var verify = rootPath("verify/index.html") + "?url=" + encodeURIComponent(siteUrl(s));
    function stat(k, inner, opts) {
      opts = opts || {};
      var cls = opts.wrap
        ? "mt-1 text-sm break-words " + (opts.soft ? "text-muted/60" : "text-foreground")
        : "mt-1 text-sm truncate text-foreground";
      var title = opts.title != null ? ' title="' + esc(opts.title) + '"' : "";
      return '<div class="min-w-0 rounded-xl border border-border/60 bg-surface-secondary/60 p-3"><div class="text-[11px] font-medium text-muted">' + esc(k) + '</div><div class="' + cls + '"' + title + ">" + inner + "</div></div>";
    }
    var statusHtml = '<span class="font-medium ' + tone + '">' + esc(st.detail) +
      '<span class="ml-1 text-[11px] font-normal ' + tone + '">· 近 30 天在线率 ' + esc(s.uptime) + '%</span>' +
      '<span class="mt-0.5 block text-[9px] font-normal text-muted/60">采集于 ' + esc(window.UPDATED || "2026-10-28") + " · 来源：howtok 每日存活探测</span></span>";
    var cells = [
      stat("支持模型", esc(models.join("、") || "—"), { title: models.join("、") || "—" }),
      stat("支付方式", esc(pays.join("、") || "—"), { title: pays.join("、") || "—" }),
      stat("最低起充", esc(shownMin || "—"), { title: shownMin || "—" }),
      stat("新用户赠金", esc(gift), { title: gift }),
      stat("可用状态", statusHtml, { wrap: true }),
      stat("价格水平", '<span class="font-medium text-muted">—</span>')
    ];
    if (s.currency === "USD") cells.push(stat("充值汇率", "¥1=$1", { title: "¥1=$1" }));
    cells.push(stat("模型真假检测", '<a href="' + esc(verify) + '" class="font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">免费实测本站 →</a>'));
    cells.push(stat("退款政策", esc(s.refund || "暂未收录"), { wrap: true, soft: !s.refund, title: s.refund || "暂未收录" }));
    cells.push(stat("开票", esc(s.invoice || "暂未收录"), { wrap: true, soft: !s.invoice, title: s.invoice || "暂未收录" }));
    var html = '<nav class="mb-6 text-xs text-muted"><a href="' + rootPath("index.html") + '" class="transition-colors hover:text-accent-strong">首页</a><span class="mx-1.5 text-border">/</span><a href="' + rootPath(stationCrumb(s)) + '" class="transition-colors hover:text-accent-strong">中转站</a><span class="mx-1.5 text-border">/</span><span class="text-foreground">' + esc(s.name) + "</span></nav>" +
      '<header class="mb-6"><h1 class="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">' + esc(s.name) + ' 怎么样?</h1><p class="mt-2 text-sm text-muted">' + esc(s.domain) + "</p>" +
      '<div class="mt-5 flex flex-wrap gap-3"><a href="' + esc(siteUrl(s)) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-accent-strong">访问 ' + esc(s.name) + ' 官网<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"></path><path d="M7 7h10v10"></path></svg></a></div></header>';
    if (s.desc) {
      html += '<section class="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-card"><h2 class="mb-2 text-sm font-semibold text-foreground">站点简介</h2><p class="text-sm leading-relaxed text-muted">' + esc(s.desc) + "</p></section>";
    }
    html += '<section class="mb-8 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2 lg:grid-cols-4">' + cells.join("") + "</section>" +
      '<section class="mb-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-card"><table class="w-full text-sm"><tbody>' +
      factRow("支持模型", esc(models.join("、") || "—")) +
      factRow("支付方式", esc(pays.join("、") || "—")) +
      factRow("按量起充", esc(shownMin || "—")) +
      factRow("订阅套餐", esc(s.sub || "—")) +
      factRow("标签", esc(tags.join("、") || "—")) +
      factRow("官网", esc(s.domain)) +
      "</tbody></table></section>";
    if (s.desc) {
      var lead = esc(s.name) + " 是一家支持 " + esc(longs.join("、") || "多家模型") + " 的 AI API 中转站" +
        (pays.length ? ",支持 " + esc(pays.join("、")) + " 充值。" : "。") +
        (shownMin ? "最低起充 " + esc(shownMin) + "。" : "具体起充与倍率以站点官网为准。");
      var second = "它把 " + esc(longs[0] || "这些模型") + " 等模型的官方接口转售给国内用户,用人民币即可调用,省去海外信用卡和网络门槛。一站覆盖多家大模型,适合需要在不同模型间切换的开发者。";
      var warns = [
        "中转站行业鱼龙混杂,首次充值建议小额测试(≤50 元),确认稳定再追加。",
        "倍率直接决定实际成本,请以官网公布的倍率表为准,不同模型/时段可能不同。"
      ];
      if (!shownMin) warns.push("本站起充与倍率信息暂缺,充值前请在官网确认。");
      var pros = stationPros(s);
      html += '<section class="mb-8 space-y-3 text-sm leading-relaxed text-muted"><p>' + lead + "</p><p>" + second + "</p></section>" +
        '<section class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="rounded-2xl border border-border bg-surface p-5 shadow-card"><h2 class="mb-3 text-sm font-semibold text-foreground">特点 / 优点</h2><ul class="space-y-2 text-sm text-muted">' +
        pros.map(function (item) { return '<li class="flex gap-2"><span class="text-accent">✓</span><span>' + esc(item) + "</span></li>"; }).join("") +
        '</ul></div><div class="rounded-2xl border border-border bg-surface p-5 shadow-card"><h2 class="mb-3 text-sm font-semibold text-foreground">注意事项</h2><ul class="space-y-2 text-sm text-muted">' +
        warns.map(function (item) { return '<li class="flex gap-2"><span class="text-amber-500">!</span><span>' + esc(item) + "</span></li>"; }).join("") +
        '</ul></div></section>' +
        '<section class="mb-10 rounded-2xl border border-accent/30 bg-accent-soft p-5"><h2 class="mb-1 text-sm font-semibold text-foreground">适合谁</h2><p class="text-sm leading-relaxed text-muted">' + esc(fitText(s)) + "</p></section>" +
        '<section class="mb-12"><h2 class="mb-4 font-display text-xl font-bold tracking-tight text-foreground">关于 ' + esc(s.name) + ' 的常见问题</h2><div class="divide-y divide-border rounded-2xl border border-border bg-surface px-5 shadow-card">' +
        '<details class="group py-4"><summary class="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">' + esc(s.name) + ' 怎么样,靠谱吗?</summary><p class="mt-2 text-sm leading-relaxed text-muted">' + esc(s.name) + " 已被 HowToken 收录,支持 " + esc(longs.join("、") || "多家模型") + "。是否适合你,需结合倍率、稳定性和你的模型需求判断,建议先用小额或赠金测试再决定。</p></details>" +
        '<details class="group py-4"><summary class="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">' + esc(s.name) + ' 支持哪些大模型?</summary><p class="mt-2 text-sm leading-relaxed text-muted">目前支持 ' + esc(longs.join("、") || "多家模型") + "。具体型号以官网为准,可能随时新增或调整。</p></details>" +
        '<details class="group py-4"><summary class="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">' + esc(s.name) + ' 怎么充值、起充多少?</summary><p class="mt-2 text-sm leading-relaxed text-muted">' +
        (pays.length ? "支持 " + esc(pays.join("、")) + " 充值。" : "充值方式暂未收录,请以官网为准。") +
        (shownMin ? "最低起充 " + esc(shownMin) + "。" : "具体起充与倍率以站点官网为准。") +
        "</p></details></div></section>";
    }
    var related = relatedStations(s);
    if (related.length) {
      html += '<section class="mb-6"><h2 class="mb-4 font-display text-xl font-bold tracking-tight text-foreground">相关中转站推荐</h2><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">' +
        related.map(relatedCard).join("") + "</div></section>";
    }
    host.innerHTML = html;
  }

  function mountPalette() {
    var box = document.getElementById("palette");
    if (!box) return;
    box.innerHTML = '<div class="backdrop"></div><div class="relative mx-auto mt-[12vh] w-[min(560px,92vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-card">' +
      '<input id="palette-q" type="text" placeholder="搜索中转站、模型..." class="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-foreground outline-none"/>' +
      '<div id="palette-list" class="max-h-80 overflow-auto p-1"></div></div>';
    var input = document.getElementById("palette-q");
    function paint(q) {
      q = (q || "").trim().toLowerCase();
      var items = [];
      (window.STATIONS || []).forEach(function (s) {
        if (items.length >= 8) return;
        var hay = (s.name + " " + s.domain).toLowerCase();
        if (!q || hay.indexOf(q) >= 0) items.push({ href: s.slug ? stationHref(s) : siteUrl(s), title: s.name, sub: s.domain, ext: !s.slug });
      });
      PAGES.forEach(function (p) {
        if (items.length >= 14) return;
        if (!q || p[0].toLowerCase().indexOf(q) >= 0) items.push({ href: rootPath(p[1]), title: p[0], sub: "页面", ext: false });
      });
      var list = document.getElementById("palette-list");
      if (!items.length) {
        list.innerHTML = '<p class="px-3 py-6 text-center text-xs text-muted">没有匹配结果</p>';
        return;
      }
      list.innerHTML = items.map(function (it, i) {
        return '<a data-i="' + i + '" href="' + esc(it.href) + '"' + (it.ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ' class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-secondary"><span class="truncate text-sm text-foreground">' + esc(it.title) + '</span><span class="ml-3 shrink-0 text-[11px] text-muted">' + esc(it.sub) + "</span></a>";
      }).join("");
    }
    input.addEventListener("input", function () { paint(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var a = document.querySelector("#palette-list a");
        if (a) window.location.href = a.getAttribute("href");
      }
    });
    box.querySelector(".backdrop").addEventListener("click", closePalette);
    function openPalette() {
      box.classList.add("open");
      input.value = "";
      paint("");
      setTimeout(function () { input.focus(); }, 20);
    }
    function closePalette() { box.classList.remove("open"); }
    window.__openPalette = openPalette;
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (box.classList.contains("open")) closePalette();
        else openPalette();
      } else if (e.key === "Escape") {
        closePalette();
        var menu = document.getElementById("sort-menu");
        if (menu) menu.classList.add("hidden");
      }
    });
    document.addEventListener("click", function () {
      var menu = document.getElementById("sort-menu");
      if (menu) menu.classList.add("hidden");
    });
  }
  function initTheme() {
    var btn = document.getElementById("theme-btn");
    if (!btn) return;
    function paint() {
      var dark = document.documentElement.classList.contains("dark");
      btn.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
      btn.innerHTML = dark
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    }
    paint();
    btn.addEventListener("click", function () {
      document.documentElement.classList.toggle("dark");
      try { localStorage.setItem("howtok-theme", document.documentElement.classList.contains("dark") ? "dark" : "light"); } catch (e) {}
      paint();
    });
  }
  function mailNote(form, text, isErr) {
    var note = form.querySelector(".mail-note");
    if (!note) return;
    note.textContent = text;
    note.classList.toggle("is-err", !!isErr);
  }
  function sendMail(form) {
    var kind = form.getAttribute("data-mail");
    var btn = form.querySelector("button[type=submit]");
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });
    if (data.hp_field) {
      mailNote(form, kind === "submit" ? "收录申请已发到邮箱。" : "留言已发到邮箱。", false);
      form.reset();
      return;
    }
    if (btn) btn.disabled = true;
    mailNote(form, "正在发送…", false);
    var root = (window.HT && HT.root) || "";
    fetch(root + "api/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: kind, fields: data })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok || !body.ok) throw new Error(body.error || "发送失败");
        mailNote(form, kind === "submit" ? "收录申请已发到邮箱，我们会查看。" : "留言已发到邮箱，我们会回复。", false);
        form.reset();
        syncMailDrops(form);
      });
    }).catch(function (err) {
      var msg = err && err.message ? err.message : "发送失败";
      if (msg === "Failed to fetch" || msg === "Load failed") {
        msg = "没发出去。请用 python server.py 打开本站后再提交，或直接发邮件到 2201219073@qq.com。";
      }
      mailNote(form, msg, true);
    }).then(function () {
      if (btn) btn.disabled = false;
    });
  }
  function guardForms() {
    document.querySelectorAll("form").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (f.getAttribute("data-mail")) {
          sendMail(f);
          return;
        }
        var note = f.querySelector("[data-local-note]");
        if (!note) {
          note = document.createElement("p");
          note.setAttribute("data-local-note", "1");
          note.className = "mt-3 text-sm text-amber-700 dark:text-amber-400";
          f.appendChild(note);
        }
        note.textContent = "这是本地复刻页面，不会提交表单，也不会把 API Key 发到任何服务器。";
      });
    });
  }
  function syncMailDrop(drop) {
    var picked = [];
    drop.querySelectorAll(".mail-drop-menu input:checked").forEach(function (el) { picked.push(el.value); });
    var hidden = drop.querySelector("input[type=hidden]");
    var btn = drop.querySelector(".mail-drop-btn");
    if (hidden) hidden.value = picked.join("、");
    if (btn) {
      btn.textContent = picked.length ? picked.join("、") : "请选择";
      btn.classList.toggle("is-empty", !picked.length);
    }
  }
  function syncMailDrops(root) {
    (root || document).querySelectorAll(".mail-drop").forEach(syncMailDrop);
  }
  function mountMailDrops() {
    var drops = document.querySelectorAll(".mail-drop");
    if (!drops.length) return;
    drops.forEach(function (drop) {
      var btn = drop.querySelector(".mail-drop-btn");
      var menu = drop.querySelector(".mail-drop-menu");
      btn.addEventListener("click", function () {
        var open = drop.classList.contains("is-open");
        document.querySelectorAll(".mail-drop.is-open").forEach(function (d) { d.classList.remove("is-open"); });
        if (!open) drop.classList.add("is-open");
      });
      menu.addEventListener("change", function () { syncMailDrop(drop); });
      syncMailDrop(drop);
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".mail-drop")) return;
      document.querySelectorAll(".mail-drop.is-open").forEach(function (d) { d.classList.remove("is-open"); });
    });
  }
  function mountPromo() {
    var header = document.querySelector("header");
    if (!header || document.getElementById("veridrop-bar")) return;
    var bar = document.createElement("a");
    bar.id = "veridrop-bar";
    bar.href = "https://www.veridrop.cn";
    bar.target = "_blank";
    bar.rel = "noopener noreferrer";
    bar.innerHTML = "<span>简约api中转站导航</span><span class=\"veridrop-url\">www.veridrop.cn</span>";
    header.insertBefore(bar, header.firstChild);
    function syncHeader() {
      document.documentElement.style.setProperty("--ht-header", header.offsetHeight + "px");
    }
    syncHeader();
    window.addEventListener("resize", syncHeader);
  }
  function boot() {
    mountPromo();
    initTheme();
    mountPalette();
    mountMailDrops();
    guardForms();
    if (HT.page === "home" || HT.page === "list") {
      mountShell();
      renderLists();
    } else if (HT.page === "station") {
      renderStation();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
