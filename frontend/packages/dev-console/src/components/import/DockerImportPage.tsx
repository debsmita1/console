import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading } from '@console/internal/components/utils';
import DockerImportForm from './DockerImportForm';

export type ImportPageProps = RouteComponentProps<{ ns?: string }>;

const DockerImportPage: React.FunctionComponent<ImportPageProps> = ({ match, location }) => {
  const namespace = match.params.ns;
  const searchParams = new URLSearchParams(location.search);
  const preselectedNamespace = searchParams.get('preselected-ns');

  return (
    <React.Fragment>
      <Helmet>
        <title>Import from Dockerfile</title>
      </Helmet>
      <PageHeading title="Import from Dockerfile" />
      <div className="co-m-pane__body">
        <DockerImportForm namespace={namespace || preselectedNamespace} />
      </div>
    </React.Fragment>
  );
};

export default DockerImportPage;
