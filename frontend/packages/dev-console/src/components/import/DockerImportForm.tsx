import * as React from 'react';
import * as plugins from '@console/internal/plugins';
import { Formik } from 'formik';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { connect } from 'react-redux';
import { ImportFormData, FirehoseList } from './import-types';
import { createResources } from './import-submit-utils';
import { validationSchema } from './import-validation-utils';
import DockerImport from './DockerImport';

export interface ImportFormProps {
  namespace: string;
  imageStreams?: FirehoseList;
}

export interface StateProps {
  perspective: string;
}

const DockerImportForm: React.FC<ImportFormProps & StateProps> = ({
  namespace,
  imageStreams,
  perspective,
}) => {
  const initialValues: ImportFormData = {
    name: '',
    project: {
      name: namespace || '',
    },
    application: {
      name: '',
      selectedKey: '',
    },
    git: {
      url: '',
      type: '',
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      dockerFilePath: '',
    },
    image: {
      selected: '',
      recommended: '',
      tag: '',
      tagObj: {},
      ports: [],
    },
    route: {
      create: true,
      targetPort: '',
      path: '',
      hostname: '',
      secure: false,
      tls: {
        termination: '',
        insecureEdgeTerminationPolicy: '',
        caCertificate: '',
        certificate: '',
        destinationCACertificate: '',
        privateKey: '',
      },
    },
    build: {
      env: [],
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
    },
    deployment: {
      env: [],
      triggers: {
        image: true,
        config: true,
      },
      replicas: 1,
    },
    labels: {},
  };

  const handleRedirect = (project: string) => {
    const perspectiveData = plugins.registry
      .getPerspectives()
      .find((item) => item.properties.id === perspective);
    const redirectURL = perspectiveData.properties.getImportRedirectURL(project);
    history.push(redirectURL);
  };

  const handleSubmit = (values, actions) => {

    const {
      project: { name: projectName },
    } = values;

    const dryRunRequests: Promise<K8sResourceKind[]> = createResources(values, true, null, true);
    dryRunRequests
      .then(() => {
        const requests: Promise<K8sResourceKind[]> = createResources(values, false, null, true);
        return requests;
      })
      .then(() => {
        actions.setSubmitting(false);
        handleRedirect(projectName);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (props) => {
    return <DockerImport {...props} />;
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={validationSchema(false)}
      render={renderForm}
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    perspective: getActivePerspective(state),
  };
};

export default connect(mapStateToProps)(DockerImportForm);
