/**
 * Serviço e utilitários de cálculo de combustível e preços de referência (ANP).
 */

export const FUEL_REGIONS = [
  {
    id: 'fortaleza',
    label: 'Fortaleza - CE (ANP)',
    price: 6.92,
    details: 'Média recente da pesquisa oficial ANP para Fortaleza'
  },
  {
    id: 'brasil',
    label: 'Média Brasil (ANP)',
    price: 6.15,
    details: 'Preço médio nacional da gasolina comum'
  },
  {
    id: 'custom',
    label: 'Preço Personalizado',
    price: 6.92,
    details: 'Valor específico do seu posto habitual'
  }
];

const STORAGE_KEYS = {
  CONSUMPTION: 'fincontrol_car_consumption_km_l',
  REGION: 'fincontrol_fuel_region',
  CUSTOM_PRICE: 'fincontrol_fuel_custom_price'
};

/**
 * Retorna o consumo salvo do carro (ou 10 km/L por padrão)
 */
export function getSavedCarConsumption() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.CONSUMPTION);
    if (val && !isNaN(parseFloat(val)) && parseFloat(val) > 0) {
      return parseFloat(val);
    }
  } catch (e) {}
  return 10; // Padrão 10 km/L
}

/**
 * Salva a média de consumo do carro para consultas futuras
 */
export function saveCarConsumption(consumption) {
  try {
    if (consumption && !isNaN(parseFloat(consumption)) && parseFloat(consumption) > 0) {
      localStorage.setItem(STORAGE_KEYS.CONSUMPTION, String(parseFloat(consumption)));
    }
  } catch (e) {}
}

/**
 * Retorna a região de combustível salva ou 'fortaleza' por padrão
 */
export function getSavedFuelRegion() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.REGION);
    if (val && FUEL_REGIONS.some(r => r.id === val)) {
      return val;
    }
  } catch (e) {}
  return 'fortaleza';
}

/**
 * Salva a região de combustível preferida
 */
export function saveFuelRegion(regionId) {
  try {
    localStorage.setItem(STORAGE_KEYS.REGION, regionId);
  } catch (e) {}
}

/**
 * Retorna o preço da gasolina baseado na região
 */
export function getPriceForRegion(regionId) {
  if (regionId === 'custom') {
    try {
      const customVal = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRICE);
      if (customVal && !isNaN(parseFloat(customVal)) && parseFloat(customVal) > 0) {
        return parseFloat(customVal);
      }
    } catch (e) {}
    return 6.92;
  }
  const found = FUEL_REGIONS.find(r => r.id === regionId);
  return found ? found.price : 6.92;
}

/**
 * Salva preço personalizado do posto
 */
export function saveCustomFuelPrice(price) {
  try {
    if (price && !isNaN(parseFloat(price)) && parseFloat(price) > 0) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_PRICE, String(parseFloat(price)));
    }
  } catch (e) {}
}

/**
 * Calcula consumo em litros e custo total em R$
 */
export function calculateFuelCost(distanceKm, consumptionKmL, pricePerLiter) {
  const km = parseFloat(distanceKm);
  const kmL = parseFloat(consumptionKmL);
  const price = parseFloat(pricePerLiter);

  if (isNaN(km) || km <= 0 || isNaN(kmL) || kmL <= 0 || isNaN(price) || price <= 0) {
    return {
      liters: 0,
      totalCost: 0,
      formattedCost: '0.00'
    };
  }

  const liters = km / kmL;
  const totalCost = liters * price;

  return {
    liters: Number(liters.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    formattedCost: totalCost.toFixed(2)
  };
}
