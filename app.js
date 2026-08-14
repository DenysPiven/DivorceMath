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
    divorceYear: num("divorceYear"),
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
  let split = null;
  let elapsed = 0;

  for (let year = 1; year <= p.horizon; year += 1) {
    for (let m = 0; m < 12; m += 1) {
      const together = year <= p.divorceYear && !split;
      const hisFlow = together ? leftoverTogether(p, "him") : leftoverApart(p, "him");
      const herFlow = together ? leftoverTogether(p, "her") : leftoverApart(p, "her");
      man = grow(man, p.hisReturn, hisFlow);
      woman = grow(woman, p.herReturn, herFlow);
      if (together) {
        hisContrib += hisFlow;
        herContrib += herFlow;
      }
      elapsed += 1;
      months.push(elapsed / 12);
      manM.push(man);
      womanM.push(woman);
    }

    if (year === p.divorceYear && !split) {
      const hisInterest = man - p.hisStart - hisContrib;
      const herInterest = woman - p.herStart - herContrib;
      const community = hisContrib + hisInterest + herContrib + herInterest;
      const herPart = community * (p.herSharePct / 100);
      const hisPart = community - herPart;
      const manBefore = man;
      const womanBefore = woman;
      man = p.hisStart + hisPart;
      woman = p.herStart + herPart;
      split = {
        hisLeftoverSalary: hisContrib,
        herLeftoverSalary: herContrib,
        hisInterest,
        herInterest,
        allInterest: hisInterest + herInterest,
        community,
        herPart,
        hisPart,
        manBefore,
        womanBefore,
        manAfter: man,
        womanAfter: woman,
        transfer: woman - womanBefore,
      };
      months.push(p.divorceYear);
      manM.push(man);
      womanM.push(woman);
    }

    manY.push(man);
    womanY.push(woman);
  }

  return {
    months,
    manM,
    womanM,
    manY,
    womanY,
    manD: manY.slice(1).map((v, i) => v - manY[i]),
    womanD: womanY.slice(1).map((v, i) => v - womanY[i]),
    split,
  };
}

let chart;

function renderChart(data, divorceYear) {
  const ctx = document.getElementById("chart");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Him",
          data: data.months.map((x, i) => ({ x, y: data.manM[i] })),
          borderColor: "#1d4ed8",
          backgroundColor: "#1d4ed8",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.05,
        },
        {
          label: "Her",
          data: data.months.map((x, i) => ({ x, y: data.womanM[i] })),
          borderColor: "#b91c1c",
          backgroundColor: "#b91c1c",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.05,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { boxWidth: 12 } },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Year" },
          ticks: { stepSize: 1 },
        },
        y: {
          title: { display: true, text: "Net worth, $" },
          ticks: {
            callback: (v) =>
              Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
          },
        },
      },
    },
    plugins: [
      {
        id: "divorceLine",
        afterDraw(c) {
          const { ctx: g, chartArea, scales } = c;
          const x = scales.x.getPixelForValue(divorceYear);
          if (x < chartArea.left || x > chartArea.right) return;
          g.save();
          g.strokeStyle = "#9ca3af";
          g.setLineDash([5, 4]);
          g.beginPath();
          g.moveTo(x, chartArea.top);
          g.lineTo(x, chartArea.bottom);
          g.stroke();
          g.fillStyle = "#6b7280";
          g.font = "12px Segoe UI, system-ui, sans-serif";
          g.fillText("Split", x + 6, chartArea.top + 12);
          g.restore();
        },
      },
    ],
  });
}

function renderStats(split, lastMan, lastWoman, horizon) {
  const transferLabel =
    split.transfer >= 0 ? "Net transfer to her" : "Net transfer to him";
  const transferValue = usd(Math.abs(split.transfer));
  const items = [
    { cls: "him", value: usd(split.manAfter), label: "Him, right after split" },
    { cls: "her", value: usd(split.womanAfter), label: "Her, right after split" },
    { cls: "", value: transferValue, label: transferLabel },
    {
      cls: "",
      value: usd(lastMan - lastWoman),
      label: `Gap at year ${horizon}`,
    },
  ];
  document.getElementById("stats").innerHTML = items
    .map(
      (s) =>
        `<div class="stat ${s.cls}"><span class="value">${s.value}</span><span class="label">${s.label}</span></div>`
    )
    .join("");
}

function renderBreakdown(split, p) {
  const rows = [
    ["His leftover salary", split.hisLeftoverSalary],
    ["Her leftover salary", split.herLeftoverSalary],
    ["His investment interest", split.hisInterest],
    ["Her investment interest", split.herInterest],
    ["Acquired assets (split)", split.community],
    [`Her share (${p.herSharePct}%)`, split.herPart],
    [`Him after split (${usd(p.hisStart)} start + his share)`, split.manAfter],
    [`Her after split (${usd(p.herStart)} start + her share)`, split.womanAfter],
  ];
  document.getElementById("split-breakdown").innerHTML = rows
    .map(([k, v]) => `<div><span>${k}</span><span>${usd(v)}</span></div>`)
    .join("");
}

function renderConclusion(split, divorceYear) {
  const amount = Math.round(Math.abs(split.transfer));
  let text;
  if (amount === 0) {
    text = `At the moment of divorce (year ${divorceYear}), nobody pays a settlement: the transfer is <strong>$0</strong>.`;
  } else if (split.transfer > 0) {
    text = `At the moment of divorce (year ${divorceYear}), he pays her <strong>${usd(amount)}</strong>.`;
  } else {
    text = `At the moment of divorce (year ${divorceYear}), she pays him <strong>${usd(amount)}</strong>.`;
  }
  document.getElementById("conclusion").innerHTML = text;
}
  const rows = data.manY
    .map((_, i) => {
      let phase = "Start";
      if (i > 0 && i < divorceYear) phase = "Together";
      if (i === divorceYear) phase = "After split";
      if (i > divorceYear) phase = "Apart";
      const splitClass = i === divorceYear ? "split-row" : "";
      return `<tr class="${splitClass}">
        <td>${i}</td>
        <td>${phase}</td>
        <td class="him-cell">${usd(data.manY[i])}</td>
        <td class="him-cell">${i ? usdDelta(data.manD[i - 1]) : "—"}</td>
        <td class="her-cell">${usd(data.womanY[i])}</td>
        <td class="her-cell">${i ? usdDelta(data.womanD[i - 1]) : "—"}</td>
      </tr>`;
    })
    .join("");

  document.getElementById("year-table").innerHTML = `
    <thead>
      <tr>
        <th>Year</th>
        <th>Phase</th>
        <th>Him</th>
        <th>His change</th>
        <th>Her</th>
        <th>Her change</th>
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
    `Leftover per month — together: him ${usd(himT)}, her ${usd(herT)}. ` +
    `After split: him ${usd(himA)}, her ${usd(herA)}.`;
}

function run(form) {
  const p = readInputs(form);
  if (p.divorceYear > p.horizon) {
    showError("Years together cannot be longer than years to project.");
    return;
  }

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
  renderStats(
    data.split,
    data.manY[data.manY.length - 1],
    data.womanY[data.womanY.length - 1],
    p.horizon
  );
  renderBreakdown(data.split, p);
  renderTable(data, p.divorceYear);
  renderChart(data, p.divorceYear);
  renderConclusion(data.split, p.divorceYear);
}

const form = document.getElementById("calc-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  run(form);
});
form.addEventListener("input", () => updateLeftoverHint(form));

updateLeftoverHint(form);
run(form);
