import * as React from 'react';
// import { UserPreferenceCustomField as CustomFieldType } from '@console/dynamic-plugin-sdk/src';
import { FormGroup } from '@patternfly/react-core';
import { ClusterConfigurationCustomField } from '@console/dynamic-plugin-sdk/src';
import { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import { ErrorBoundaryInline } from '@console/shared/src/components/error';
import { ResolvedClusterConfigurationItem } from './types';

type ClusterConfigurationCustomFieldProps = {
  item: ResolvedClusterConfigurationItem;
  field: ResolvedCodeRefProperties<ClusterConfigurationCustomField>;
};

const ClusterConfigurationCustomField: React.FC<ClusterConfigurationCustomFieldProps> = ({
  item,
  field,
}) => {
  const CustomComponent = field.component;

  return (
    <ErrorBoundaryInline>
      {CustomComponent ? (
        <FormGroup fieldId={item.id} label={item.label} data-test={`${item.id} field`}>
          <CustomComponent {...field.props} readonly={item.readonly} />
        </FormGroup>
      ) : null}
    </ErrorBoundaryInline>
  );
};

export default ClusterConfigurationCustomField;
