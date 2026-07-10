import { CURRENT_PLAN, FEATURES } from "./subscription";

const rights = FEATURES[CURRENT_PLAN];

export function hasAds() {
  return rights.ads;
}

export function historyDays() {
  return rights.historyDays;
}

export function canUseFavorites() {
  return rights.favorites;
}

export function canUseMap() {
  return rights.map;
}

export function canUseAlerts() {
  return rights.alerts;
}

export function canUsePredictions() {
  return rights.predictions;
}

export function currentPlan() {
  return CURRENT_PLAN;
}
