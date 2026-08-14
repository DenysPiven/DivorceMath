const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function usd(n) {
  const value = money.format(Math.abs(n));
  return n < 0 ? `−${value}` : value;
}

function usdDelta(n) {
  if (n > 0) return `+${usd(n)}`;
  if (n < 0) return usd(n);
  return "$0";
}

function readInputs(form) {
  const data = new FormData(form);
  const num = (name) => Number(data.get(name));
  return {
    hisIncome: num("hisIncome"),
    herIncome: num("herIncome"),
    hisSpend: num("hisSpend"),
    herSpend: num("herSpend"),
    hePaysForHer: num("hePaysForHer"),
    shePaysForHim: num("shePaysForHim"),
    hisStart: num("hisStart"),
    herStart: num("herStart"),
    hisReturn: num("hisReturn"),
    herReturn: num("herReturn"),
    horizon: num("horizon"),
    herSharePct: num("herSharePct"),
  };
}

function leftoverTogether(p, who) {
  if (who === "him") {
    return p.hisIncome - p.hisSpend - p.hePaysForHer + p.shePaysForHim;
  }
  return p.herIncome - p.herSpend - p.shePaysForHim + p.hePaysForHer;
}

function leftoverApart(p, who) {
  if (who === "him") return p.hisIncome - p.hisSpend;
  return p.herIncome - p.herSpend;
}

function grow(balance, annualPct, contribution) {
  return balance * (1 + annualPct / 100 / 12) + contribution;
}

function splitAt(p, man, woman, hisContrib, herContrib) {
  const hisInterest = man - p.hisStart - hisContrib;
  const herInterest = woman - p.herStart - herContrib;
  const community = hisContrib + hisInterest + herContrib + herInterest;
  const herPart = community * (p.herSharePct / 100);
  const hisPart = community - herPart;
  const manAfter = p.hisStart + hisPart;
  const womanAfter = p.herStart + herPart;
  return {
    hisLeftoverSalary: hisContrib,
    herLeftoverSalary: herContrib,
    hisInterest,
    herInterest,
    allInterest: hisInterest + herInterest,
    community,
    herPart,
    hisPart,
    manBefore: man,
    womanBefore: woman,
    manAfter,
    womanAfter,
    hisGain: manAfter - man,
    herGain: womanAfter - woman,
    transfer: womanAfter - woman,
  };
}

function simulate(p) {
  let man = p.hisStart;
  let woman = p.herStart;
  let hisContrib = 0;
  let herContrib = 0;
  const months = [0];
  const manM = [man];
  const womanM = [woman];
  const manY = [man];
  const womanY = [woman];
  const splits = [null];
  let elapsed = 0;

  for (let year = 1; year <= p.horizon; year += 1) {
    for (let m = 0; m < 12; m += 1) {
      const hisFlow = leftoverTogether(p, "him");
      const herFlow = leftoverTogether(p, "her");
      man = grow(man, p.hisReturn, hisFlow);
      woman = grow(woman, p.herReturn, herFlow);
      hisContrib += hisFlow;
      herContrib += herFlow;
      elapsed += 1;
      months.push(elapsed / 12);
      manM.push(man);
      womanM.push(woman);
    }
    manY.push(man);
    womanY.push(woman);
    splits.push(splitAt(p, man, woman, hisContrib, herContrib));
  }

  return {
    months,
    manM,
    womanM,
    manY,
    womanY,
    manD: manY.slice(1).map((v, i) => v - manY[i]),
    womanD: womanY.slice(1).map((v, i) => v - womanY[i]),
    splits,
  };
}

let chart;
let lastChart;

function themeColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    ink: s.getPropertyValue("--ink").trim(),
    muted: s.getPropertyValue("--muted").trim(),
    line: s.getPropertyValue("--line").trim(),
    him: s.getPropertyValue("--him").trim(),
    her: s.getPropertyValue("--her").trim(),
  };
}

function renderChart(data) {
  lastChart = { data };
  const ctx = document.getElementById("chart");
  const c = themeColors();
  if (chart) chart.destroy();
  Chart.defaults.color = c.muted;
  Chart.defaults.borderColor = c.line;
  const years = data.splits
    .map((s, i) => (s ? { x: i, yHim: s.manAfter, yHer: s.womanAfter } : null))
    .filter(Boolean);
  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Him, stay together",
          data: data.months.map((x, i) => ({ x, y: data.manM[i] })),
          borderColor: c.him,
          backgroundColor: c.him,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.05,
        },
        {
          label: "Her, stay together",
          data: data.months.map((x, i) => ({ x, y: data.womanM[i] })),
          borderColor: c.her,
          backgroundColor: c.her,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.05,
        },
        {
          label: "Him if divorced this year",
          data: years.map((p) => ({ x: p.x, y: p.yHim })),
          borderColor: c.him,
          backgroundColor: c.him,
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0,
        },
        {
          label: "Her if divorced this year",
          data: years.map((p) => ({ x: p.x, y: p.yHer })),
          borderColor: c.her,
          backgroundColor: c.her,
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false, axis: "x" },
      plugins: {
        legend: { labels: { boxWidth: 12, color: c.ink } },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Year", color: c.muted },
          ticks: { stepSize: 1, color: c.muted },
          grid: { color: c.line },
        },
        y: {
          title: { display: true, text: "Net worth, $", color: c.muted },
          ticks: {
            color: c.muted,
            callback: (v) =>
              Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
          },
          grid: { color: c.line },
        },
      },
    },
  });
}

function renderStats(data) {
  const last = data.splits[data.splits.length - 1];
  const year = data.splits.length - 1;
  const perMonth = last.transfer / (year * 12);
  const items = [
    { cls: "him", value: usd(data.manY[year]), label: `Him at year ${year}, still together` },
    { cls: "her", value: usd(data.womanY[year]), label: `Her at year ${year}, still together` },
    {
      cls: "",
      value: usd(Math.abs(last.transfer)),
      label: last.transfer >= 0 ? `If divorced year ${year}, he pays her` : `If divorced year ${year}, she pays him`,
    },
    {
      cls: "",
      value: usd(Math.abs(perMonth)),
      label: "Per month of marriage at that year",
    },
  ];
  document.getElementById("stats").innerHTML = items
    .map(
      (s) =>
        `<div class="stat ${s.cls}"><span class="value">${s.value}</span><span class="label">${s.label}</span></div>`
    )
    .join("");
}

function renderBreakdown(data, p) {
  const last = data.splits[data.splits.length - 1];
  const year = data.splits.length - 1;
  const rows = [
    [`If they divorced at year ${year}`, ""],
    ["His leftover salary", last.hisLeftoverSalary],
    ["Her leftover salary", last.herLeftoverSalary],
    ["His investment interest", last.hisInterest],
    ["Her investment interest", last.herInterest],
    ["Acquired assets (would be split)", last.community],
    [`Her share (${p.herSharePct}%)`, last.herPart],
    ["Him after that divorce", last.manAfter],
    ["Her after that divorce", last.womanAfter],
  ];
  document.getElementById("split-breakdown").innerHTML = rows
    .map(([k, v]) =>
      v === ""
        ? `<div><span>${k}</span><span></span></div>`
        : `<div><span>${k}</span><span>${usd(v)}</span></div>`
    )
    .join("");
}

function renderConclusion(data) {
  const parts = data.splits
    .map((s, year) => {
      if (!s) return "";
      const amount = Math.round(Math.abs(s.transfer));
      const months = year * 12;
      const perMonth = usd(amount / months);
      if (amount === 0) {
        return `Year ${year}: nobody would pay a settlement (<strong>$0</strong>, <strong>$0 per month</strong>).`;
      }
      if (s.transfer > 0) {
        return `Year ${year}: he would pay her <strong>${usd(amount)}</strong> — she costs him <strong>${perMonth} per month</strong> of marriage.`;
      }
      return `Year ${year}: she would pay him <strong>${usd(amount)}</strong> — he costs her <strong>${perMonth} per month</strong> of marriage.`;
    })
    .filter(Boolean);
  document.getElementById("conclusion").innerHTML = parts.join("<br>");
}

function renderTable(data) {
  const rows = data.manY
    .map((_, i) => {
      const s = data.splits[i];
      if (!s) {
        return `<tr>
          <td>${i}</td>
          <td class="him-cell">${usd(data.manY[i])}</td>
          <td class="her-cell">${usd(data.womanY[i])}</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
        </tr>`;
      }
      const who =
        Math.round(s.transfer) === 0
          ? "—"
          : s.transfer > 0
            ? "He → she"
            : "She → he";
      return `<tr>
        <td>${i}</td>
        <td class="him-cell">${usd(s.manBefore)}</td>
        <td class="her-cell">${usd(s.womanBefore)}</td>
        <td class="him-cell">${usd(s.manAfter)}</td>
        <td class="her-cell">${usd(s.womanAfter)}</td>
        <td class="him-cell">${usdDelta(s.hisGain)}</td>
        <td class="her-cell">${usdDelta(s.herGain)}</td>
        <td>${who} ${Math.round(s.transfer) === 0 ? "" : usd(Math.abs(s.transfer))} (${usd(Math.abs(s.transfer) / (i * 12))}/mo)</td>
      </tr>`;
    })
    .join("");

  document.getElementById("year-table").innerHTML = `
    <thead>
      <tr>
        <th>Year</th>
        <th>Him together</th>
        <th>Her together</th>
        <th>Him if divorce</th>
        <th>Her if divorce</th>
        <th>His gain/loss</th>
        <th>Her gain/loss</th>
        <th>Settlement</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function showError(msg) {
  const el = document.getElementById("form-error");
  el.hidden = !msg;
  el.textContent = msg || "";
}

function updateLeftoverHint(form) {
  const p = readInputs(form);
  const himT = leftoverTogether(p, "him");
  const herT = leftoverTogether(p, "her");
  const himA = leftoverApart(p, "him");
  const herA = leftoverApart(p, "her");
  document.getElementById("leftover-hint").textContent =
    `Leftover per month while together: him ${usd(himT)}, her ${usd(herT)}. ` +
    `If they divorced, leftover would become: him ${usd(himA)}, her ${usd(herA)}.`;
}

function run(form) {
  const p = readInputs(form);
  const warnings = [];
  if (leftoverTogether(p, "him") < 0) {
    warnings.push("While together, his leftover is negative, so his portfolio is drawn down.");
  }
  if (leftoverTogether(p, "her") < 0) {
    warnings.push("While together, her leftover is negative, so her savings are drawn down.");
  }
  showError(warnings.join(" "));

  const data = simulate(p);
  document.getElementById("results").hidden = false;
  renderStats(data);
  renderBreakdown(data, p);
  renderTable(data);
  renderChart(data);
  renderConclusion(data);
}

const form = document.getElementById("calc-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  run(form);
});
form.addEventListener("input", () => updateLeftoverHint(form));

updateLeftoverHint(form);
run(form);

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function syncThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const next = currentTheme() === "dark" ? "light" : "dark";
  btn.setAttribute("aria-label", `Switch to ${next} theme`);
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  syncThemeToggle();
  if (lastChart) renderChart(lastChart.data);
});

syncThemeToggle();
