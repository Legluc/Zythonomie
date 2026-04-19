import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestBeer, createTestBrewery, createTestCategory } from '../helpers/factories';
import {
  findAllBeers,
  findBeerById,
  createBeer,
  updateBeer,
  softDeleteBeer,
  addBreweryToBeer,
  removeBreweryFromBeer,
  addCategoryToBeer,
} from '../../src/services/beer.service';

describe('beer.service', () => {
  it('findAllBeers returns active beers', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'TestBeerAll' });
      const beers = await findAllBeers();
      expect(beers.length).toBeGreaterThan(0);
      expect(beers.some((b) => b.name === 'TestBeerAll')).toBe(true);
    });
  });

  it('findAllBeers filters by alcool', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'WithAlcool', alcool: true });
      await createTestBeer({ name: 'WithoutAlcool', alcool: false });

      const withAlcool = await findAllBeers({ alcool: true });
      const withoutAlcool = await findAllBeers({ alcool: false });

      expect(withAlcool.some((b) => b.name === 'WithAlcool')).toBe(true);
      expect(withAlcool.some((b) => b.name === 'WithoutAlcool')).toBe(false);
      expect(withoutAlcool.some((b) => b.name === 'WithoutAlcool')).toBe(true);
    });
  });

  it('findBeerById returns a beer', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const found = await findBeerById(beer.id);
      expect(found.id).toBe(beer.id);
    });
  });

  it('findBeerById throws 404 for non-existent', async () => {
    await withTestTransaction(async () => {
      await expect(findBeerById(999999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'BEER_NOT_FOUND',
      });
    });
  });

  it('createBeer creates with brewery and category links', async () => {
    await withTestTransaction(async () => {
      const brewery = await createTestBrewery();
      const category = await createTestCategory();

      const beer = await createBeer({
        name: 'Linked Beer',
        description: 'A linked beer',
        alcool: true,
        percentage_alcool: 5.5,
        EAN: 8888888,
        image: 'https://test.com/linked.jpg',
        brewery_ids: [brewery.id],
        category_ids: [category.id],
      });

      expect(beer.name).toBe('Linked Beer');
      expect(beer.breweries.length).toBe(1);
      expect(beer.categories.length).toBe(1);
    });
  });

  it('updateBeer updates fields', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const updated = await updateBeer(beer.id, { name: 'Updated Beer' });
      expect(updated.name).toBe('Updated Beer');
    });
  });

  it('softDeleteBeer soft-deletes', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      await softDeleteBeer(beer.id);
      await expect(findBeerById(beer.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'BEER_NOT_FOUND',
      });
    });
  });

  it('addBreweryToBeer links a brewery', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const brewery = await createTestBrewery();

      const result = await addBreweryToBeer(beer.id, brewery.id);
      expect(result.breweries.length).toBe(1);
      expect(result.breweries[0].brewery.id).toBe(brewery.id);
    });
  });

  it('addBreweryToBeer throws 409 for duplicate link', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const brewery = await createTestBrewery();

      await addBreweryToBeer(beer.id, brewery.id);

      await expect(addBreweryToBeer(beer.id, brewery.id)).rejects.toMatchObject({
        statusCode: 409,
        code: 'LINK_ALREADY_EXISTS',
      });
    });
  });

  it('removeBreweryFromBeer unlinks a brewery', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const brewery = await createTestBrewery();

      await addBreweryToBeer(beer.id, brewery.id);
      const result = await removeBreweryFromBeer(beer.id, brewery.id);
      expect(result.breweries.length).toBe(0);
    });
  });

  it('addCategoryToBeer links a category', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const category = await createTestCategory();

      const result = await addCategoryToBeer(beer.id, category.id);
      expect(result.categories.length).toBe(1);
      expect(result.categories[0].category.id).toBe(category.id);
    });
  });
});
