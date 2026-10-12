import { useMemo } from 'react'

import type { Category, Product, Restaurant, Tax } from '@/admin/domain'
import {
  sampleCategories,
  sampleProducts,
  sampleRestaurant,
  sampleTaxes,
} from '@/admin/data/samples'
import { useAdminResource } from '@/admin/hooks/useAdminResource'
import { toNumber } from '@/admin/utils/format'
import { getCategories } from '@/services/categoryService'
import { getProducts } from '@/services/productService'
import { getRestaurants } from '@/services/restaurantService'
import { getTaxes } from '@/services/taxService'

/**
 * Everything the customer kiosk needs to show the menu.
 *
 * Shares the admin's fallback behaviour: until the Laravel menu endpoints exist
 * the sample menu from `admin/data/samples.ts` stands in, so the kiosk is
 * usable today and switches to real data as soon as the API answers.
 */
export function useMenu() {
  const restaurants = useAdminResource<Restaurant[]>(
    ['kiosk', 'restaurants'],
    getRestaurants,
    [sampleRestaurant],
  )
  const categories = useAdminResource<Category[]>(
    ['kiosk', 'categories'],
    getCategories,
    sampleCategories,
  )
  const products = useAdminResource<Product[]>(['kiosk', 'products'], getProducts, sampleProducts)
  const taxes = useAdminResource<Tax[]>(['kiosk', 'taxes'], getTaxes, sampleTaxes)

  return useMemo(() => {
    // One kiosk serves one restaurant; take the first the API returns.
    const restaurant = restaurants.data[0] ?? sampleRestaurant

    const activeCategories = categories.data
      .filter((category) => category.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)

    // Every active tax applies to a kiosk order; rates are stored as percents.
    const taxRate =
      taxes.data.filter((tax) => tax.is_active).reduce((sum, tax) => sum + toNumber(tax.rate), 0) /
      100

    return {
      restaurantName: restaurant.name,
      restaurantId: restaurant.id,
      categories: activeCategories,
      products: products.data,
      taxRate,
      isLoading: categories.isLoading || products.isLoading,
    }
  }, [
    restaurants.data,
    categories.data,
    categories.isLoading,
    products.data,
    products.isLoading,
    taxes.data,
  ])
}
