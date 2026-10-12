import {
  Coffee,
  Croissant,
  CupSoda,
  Drumstick,
  EggFried,
  Hamburger,
  IceCreamCone,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

/**
 * First match wins, so the more specific words come before the broad ones
 * ("chicken sandwich" should draw a drumstick, not a burger).
 */
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/chicken|nugget|wing|drumstick/i, Drumstick],
  [/burger/i, Hamburger],
  [/sandwich|wrap|sub\b/i, Sandwich],
  [/fries|side|ring|popcorn/i, Popcorn],
  [/coffee|latte|espresso|tea\b/i, Coffee],
  [/shake|soda|drink|beverage|juice|cola/i, CupSoda],
  [/sundae|ice cream|cone|dessert|pie|cookie/i, IceCreamCone],
  [/salad|veg/i, Salad],
  [/breakfast|egg|muffin|pancake/i, EggFried],
  [/croissant|pastry|bakery/i, Croissant],
  [/soup/i, Soup],
]

export const iconFor = (...names: (string | null | undefined)[]): LucideIcon => {
  for (const name of names) {
    if (!name) continue
    const rule = ICON_RULES.find(([pattern]) => pattern.test(name))
    if (rule) return rule[1]
  }
  return Utensils
}
