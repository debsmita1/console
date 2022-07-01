import { describe, it, before } from "../test-env-framework/api";
import { watchResource } from "../test-env-framework/lib/watchResource";

describe('DeploymentConfig', () => {
  it('automatically start a Pod based on x', () => {
    watchResource({ kind: 'DeploymentConfig' }, () => {
      console.log('callback');
    });
  });

  it('automatically start these Pods after a second', () => {

  });

  it('automatically removes all Pods if the DC is deleted', () => {

  });
});
