import starsJson from "../../data/stars.json";

export type CatalogStar = {
  id: string;
  name: string;
  constellation: string;
  ra: number;
  dec: number;
  mag: number;
  ulugh: string;
  modern: string;
};

export const CATALOG_STARS = starsJson as CatalogStar[];

export function getStarById(id: string): CatalogStar | undefined {
  return CATALOG_STARS.find((s) => s.id === id);
}
