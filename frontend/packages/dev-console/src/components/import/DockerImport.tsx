import * as React from 'react';
import * as _ from 'lodash';
import { Form, Button } from 'patternfly-react';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import GitSection from './git/GitSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';

const DockerImport: React.FC<FormikProps<FormikValues>> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
}) => (
  <Form onReset={handleReset} onSubmit={handleSubmit}>
    <div className="co-m-pane__form">
      <GitSection project={values.project} isDockerImport={true}/>
      <AppSection project={values.project} />
      <AdvancedSection values={values} />
    </div>
    <br />
    <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
      <Button disabled={!dirty || !_.isEmpty(errors)} type="submit" bsStyle="primary">
        Create
      </Button>
      <Button type="reset">Cancel</Button>
    </ButtonBar>
  </Form>
);

export default DockerImport;
