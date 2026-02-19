import { v4 as uuidv4 } from 'uuid';
import type { Point2 } from './math';

export type FoodType = 'food_ball' | 'creature';

export type FoodStatus = 'available' | { eaten: number };

export interface Edible {
  getEdibleId(): string;
  getType(): FoodType;
}

export interface Food extends Edible {
  id: string;
  position: Point2;
  status: FoodStatus;
}

export function createFood(position: Point2): Food {
  const id = uuidv4();
  return {
    id,
    position: [position[0], position[1]],
    status: 'available',
    getEdibleId() { return this.id; },
    getType() { return 'food_ball'; },
  };
}

export function isFoodEaten(food: Food): boolean {
  return food.status !== 'available';
}
