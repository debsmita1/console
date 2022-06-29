import { watchResource } from "../test-env-framework/lib/watchResource";

watchResource({ kind: 'DeploymentConfig' }, () => {
  console.log('callback');
});
