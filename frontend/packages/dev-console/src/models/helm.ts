import { K8sKind } from '@console/internal/module/k8s';

export const HelmModel: K8sKind = {
  apiGroup: '',
  apiVersion: '',
  kind: 'HelmRelases',
  id: 'helmrelease',
  plural: 'helmreleases',
  label: 'Helm Release',
  labelPlural: 'Helm Releases',
  abbr: 'HR',
  namespaced: true,
  crd: true,
};
