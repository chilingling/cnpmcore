import assert = require('assert');
import { app } from 'egg-mock/bootstrap';
import { Context } from 'egg';
import { RegistryManagerService } from 'app/core/service/RegistryManagerService';
import { RegistryType } from 'app/common/enum/Registry';

describe('test/core/service/RegistryManagerService/index.test.ts', () => {
  let ctx: Context;
  let registryManagerService: RegistryManagerService;

  before(async () => {
    ctx = await app.mockModuleContext();
    registryManagerService = await ctx.getEggObject(RegistryManagerService);
  });

  beforeEach(async () => {
    // create Registry
    await registryManagerService.createRegistry({
      name: 'custom',
      changeStream: 'https://r.cnpmjs.org/_changes',
      host: 'https://cnpmjs.org',
      userPrefix: 'cnpm:',
      type: RegistryType.Cnpmcore,
    });
  });

  afterEach(async () => {
    await app.destroyModuleContext(ctx);
  });

  describe('RegistryManagerService', () => {

    describe('query should work', async () => {
      beforeEach(async () => {
        // create another
        await registryManagerService.createRegistry({
          name: 'custom2',
          changeStream: 'https://r.cnpmjs.org/_changes',
          host: 'https://cnpmjs.org',
          userPrefix: 'ccnpm:',
          type: RegistryType.Cnpmcore,
        });
      });

      it('query success', async () => {
        // query success
        const queryRes = await registryManagerService.listRegistries({});
        assert(queryRes.count === 2);
        const [ _, registry ] = queryRes.data;
        assert(_);
        assert(registry.name === 'custom2');
      });

      it('pageOptions should work', async () => {
        // pageOptions should work
        let queryRes = await registryManagerService.listRegistries({ pageIndex: 0, pageSize: 1 });
        console.log(queryRes.data);
        assert(queryRes.count === 2);
        assert(queryRes.data.length === 1);
        const [ firstRegistry ] = queryRes.data;
        assert(firstRegistry.name === 'custom');

        queryRes = await registryManagerService.listRegistries({ pageIndex: 1, pageSize: 1 });
        assert(queryRes.count === 2);
        assert(queryRes.data.length === 1);
        const [ secondRegistry ] = queryRes.data;
        assert(secondRegistry.name === 'custom2');
      });

    });

    it('update work', async () => {
      let queryRes = await registryManagerService.listRegistries({});
      const [ registry ] = queryRes.data;

      await registryManagerService.updateRegistry({
        ...registry,
        name: 'custom3',
      });

      queryRes = await registryManagerService.listRegistries({});
      assert(queryRes.data[0].name === 'custom3');

    });

    it('update should check registry', async () => {
      const queryRes = await registryManagerService.listRegistries({});
      assert(queryRes.count === 1);
      const [ registry ] = queryRes.data;
      await assert.rejects(
        registryManagerService.updateRegistry({
          ...registry,
          registryId: 'not_exist',
          name: 'boo',
        }),
        /not found/,
      );
    });

    it('remove should work', async () => {
      let queryRes = await registryManagerService.listRegistries({});
      assert(queryRes.count === 1);
      await registryManagerService.remove({ registryId: queryRes.data[0].registryId });
      queryRes = await registryManagerService.listRegistries({});
      assert(queryRes.count === 0);
    });
  });
});