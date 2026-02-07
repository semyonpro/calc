const tabs = document.querySelectorAll(".tab-button");
const panels = {
  calc: document.querySelector("#tab-calc"),
  materials: document.querySelector("#tab-materials"),
};

const calcForm = document.querySelector("#calc-form");
const materialsForm = document.querySelector("#materials-form");
const hasLandingInput = document.querySelector("#has-landing");
const landingFields = document.querySelector("#landing-fields");
const resetCalcButton = document.querySelector("#reset-calc");
const saveMaterialsButton = document.querySelector("#save-materials");
const resetMaterialsButton = document.querySelector("#reset-materials");
const materialsSuccess = document.querySelector("#materials-success");
const calcError = document.querySelector("#calc-error");

const resultsSection = document.querySelector("#results");
const totalPriceEl = document.querySelector("#total-price");
const totalStepsEl = document.querySelector("#total-steps");
const railMetersEl = document.querySelector("#rail-meters");
const costStepsEl = document.querySelector("#cost-steps");
const costMetalEl = document.querySelector("#cost-metal");
const costAnchorEl = document.querySelector("#cost-anchor");
const costOilEl = document.querySelector("#cost-oil");
const costRailEl = document.querySelector("#cost-rail");
const costLandingEl = document.querySelector("#cost-landing");
const costPartsEl = document.querySelector("#cost-parts");

const DEFAULT_MATERIALS = {
  woodPrices: {
    oak: 65000,
    beech: 52000,
    birch: 42000,
  },
  rodPrice: 1200,
  anchorPrice: 850,
  landingPrice: 11000,
  winderCoef: 1.1,
  oilPrice: 1800,
  railPrice: 4500,
  woodType: "oak",
};

const MATERIALS_KEY = "stairs-materials";

const numberFormatter = new Intl.NumberFormat("ru-RU");
const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const meterFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return `${moneyFormatter.format(Math.round(value))} ₽`;
}

function formatMeters(value) {
  return `${meterFormatter.format(value)} м`;
}

function readNumber(selector) {
  const value = document.querySelector(selector).value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function switchTab(target) {
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === target));
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle("is-active", key === target);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

hasLandingInput.addEventListener("change", () => {
  landingFields.hidden = !hasLandingInput.checked;
});

resetCalcButton.addEventListener("click", () => {
  calcForm.reset();
  document.querySelector("#steps-straight").value = "0";
  document.querySelector("#steps-winder").value = "0";
  document.querySelector("#balustrade-length").value = "0";
  hasLandingInput.checked = false;
  landingFields.hidden = true;
  resultsSection.hidden = true;
  calcError.textContent = "";
});

function loadMaterials() {
  const stored = localStorage.getItem(MATERIALS_KEY);
  if (!stored) {
    return DEFAULT_MATERIALS;
  }
  try {
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_MATERIALS,
      ...parsed,
      woodPrices: {
        ...DEFAULT_MATERIALS.woodPrices,
        ...(parsed.woodPrices || {}),
      },
    };
  } catch (error) {
    return DEFAULT_MATERIALS;
  }
}

function saveMaterials(materials) {
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
}

function setMaterialsForm(materials) {
  document.querySelector("#wood-oak").value = materials.woodPrices.oak;
  document.querySelector("#wood-beech").value = materials.woodPrices.beech;
  document.querySelector("#wood-birch").value = materials.woodPrices.birch;
  document.querySelector("#rod-price").value = materials.rodPrice;
  document.querySelector("#anchor-price").value = materials.anchorPrice;
  document.querySelector("#landing-price").value = materials.landingPrice;
  document.querySelector("#winder-coef").value = materials.winderCoef;
  document.querySelector("#oil-price").value = materials.oilPrice;
  document.querySelector("#rail-price").value = materials.railPrice;
  document.querySelector("#wood-type").value = materials.woodType;
}

function getMaterialsForm() {
  return {
    woodPrices: {
      oak: readNumber("#wood-oak"),
      beech: readNumber("#wood-beech"),
      birch: readNumber("#wood-birch"),
    },
    rodPrice: readNumber("#rod-price"),
    anchorPrice: readNumber("#anchor-price"),
    landingPrice: readNumber("#landing-price"),
    winderCoef: readNumber("#winder-coef"),
    oilPrice: readNumber("#oil-price"),
    railPrice: readNumber("#rail-price"),
    woodType: document.querySelector("#wood-type").value,
  };
}

let materials = loadMaterials();
setMaterialsForm(materials);

saveMaterialsButton.addEventListener("click", () => {
  materials = getMaterialsForm();
  saveMaterials(materials);
  materialsSuccess.textContent = "Материалы сохранены.";
  setTimeout(() => {
    materialsSuccess.textContent = "";
  }, 2000);
});

resetMaterialsButton.addEventListener("click", () => {
  materials = { ...DEFAULT_MATERIALS, woodPrices: { ...DEFAULT_MATERIALS.woodPrices } };
  setMaterialsForm(materials);
  saveMaterials(materials);
  materialsSuccess.textContent = "Значения сброшены к умолчанию.";
  setTimeout(() => {
    materialsSuccess.textContent = "";
  }, 2000);
});

calcForm.addEventListener("submit", (event) => {
  event.preventDefault();
  calcError.textContent = "";

  const straightSteps = Math.floor(readNumber("#steps-straight"));
  const winderSteps = Math.floor(readNumber("#steps-winder"));
  const riseMm = readNumber("#step-rise");
  const treadMm = readNumber("#step-tread");
  const widthMm = readNumber("#step-width");
  const lengthMm = readNumber("#step-length");
  const balustradeLength = readNumber("#balustrade-length");
  const hasLanding = hasLandingInput.checked;
  const landingWidth = readNumber("#landing-width");
  const landingLength = readNumber("#landing-length");

  if (straightSteps + winderSteps <= 0) {
    calcError.textContent = "Укажите количество ступеней.";
    resultsSection.hidden = true;
    return;
  }

  if (riseMm <= 0 || treadMm <= 0 || widthMm <= 0 || lengthMm <= 0) {
    calcError.textContent = "Заполните все размеры ступени.";
    resultsSection.hidden = true;
    return;
  }

  if (hasLanding && (landingWidth <= 0 || landingLength <= 0)) {
    calcError.textContent = "Укажите размеры площадки.";
    resultsSection.hidden = true;
    return;
  }

  const rise = riseMm / 1000;
  const tread = treadMm / 1000;
  const length = lengthMm / 1000;

  const woodPrice = materials.woodPrices[materials.woodType];
  const stepVolume = (tread + 0.06) * 0.06 * length;
  const stepStraightCost = woodPrice * stepVolume * 1.5;
  const stepWinderCost = stepStraightCost * materials.winderCoef;
  const stepsCost = straightSteps * stepStraightCost + winderSteps * stepWinderCost;

  const metalCost = (straightSteps * 0.44 + winderSteps * 0.66) * materials.rodPrice;
  const anchorCost = (straightSteps * 0.4 + winderSteps * 0.6) * materials.anchorPrice;

  const stepArea = tread * length;
  const totalArea = (straightSteps + winderSteps) * stepArea;
  const oilLiters = totalArea / 15;
  const oilCost = oilLiters * materials.oilPrice;

  const hypotenuse = Math.sqrt(tread ** 2 + rise ** 2);
  const railMeters = straightSteps * hypotenuse + balustradeLength;
  const railCost = railMeters * materials.railPrice;

  const landingCost = hasLanding ? landingWidth * landingLength * materials.landingPrice : 0;

  const partsCost = stepsCost + metalCost + anchorCost + oilCost + railCost + landingCost;
  const totalCost = partsCost * 4;

  totalPriceEl.textContent = formatMoney(totalCost);
  totalStepsEl.textContent = numberFormatter.format(straightSteps + winderSteps);
  railMetersEl.textContent = formatMeters(railMeters);

  costStepsEl.textContent = formatMoney(stepsCost);
  costMetalEl.textContent = formatMoney(metalCost);
  costAnchorEl.textContent = formatMoney(anchorCost);
  costOilEl.textContent = formatMoney(oilCost);
  costRailEl.textContent = formatMoney(railCost);
  costLandingEl.textContent = formatMoney(landingCost);
  costPartsEl.textContent = formatMoney(partsCost);

  resultsSection.hidden = false;
});
