import * as React from 'react';
import * as _ from 'lodash';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { getRevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficSplittingModal from './TrafficSplittingModal';

export interface TrafficSplittingProps {
  service: K8sResourceKind;
  revisions: K8sResourceKind[];
  errorMessage?: string;
  cancel?: () => void;
  close?: () => void;
}

export interface TrafficSplittingType {
  trafficSplitting: {
    percentage: number;
    tag: string;
    revisionName: string;
  };
}

export const constructObjForUpdate = (traffic, service) => {
  const obj = _.omit(service, 'status');
  return {
    ...obj,
    spec: { ...obj.spec, traffic },
  };
};

const TrafficSplitting: React.FC<TrafficSplittingProps> = ({
  service,
  revisions,
  cancel,
  close,
  errorMessage,
}) => {
  const traffic = _.get(
    service,
    ['status', 'traffic'],
    [{ percent: 0, tag: '', revisionName: '' }],
  );
  const revisionItems = getRevisionItems(revisions);
  const initialValues: TrafficSplittingType = {
    trafficSplitting: traffic.map((t) => ({
      percent: t.percent,
      tag: t.tag || '',
      revisionName: t.revisionName || '',
    })),
  };
  const [error, setError] = React.useState(errorMessage);
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const obj = constructObjForUpdate(values.trafficSplitting, service);
    k8sUpdate(ServiceModel, obj)
      .then(() => {
        action.setSubmitting(false);
        setError('');
        close();
      })
      .catch((err) => {
        setError(err.message || 'An error occurred. Please try again');
      });
  };

  const handleReset = (values: FormikValues, actions: FormikHelpers<FormikValues>) => {
    actions.setValues(initialValues);
    cancel();
  };
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={handleReset}
      render={(props) => (
        <TrafficSplittingModal {...props} errorMessage={error} revisionItems={revisionItems} />
      )}
    />
  );
};
export default TrafficSplitting;
