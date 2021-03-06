/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup, ControlLabel, HelpBlock } from 'patternfly-react';
import { DropdownFieldProps } from './field-types';
import { Dropdown } from '../../../../components/utils';
import { getValidationState } from './field-utils';

const DropdownField: React.FC<DropdownFieldProps> = ({ label, helpText, ...props }) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  return (
    <FormGroup
      controlId={`${props.name}-field`}
      validationState={getValidationState(error, touched)}
    >
      <ControlLabel className={cx({ 'co-required': props.required })}>{label}</ControlLabel>
      <Dropdown
        id={`${props.name}-field`}
        {...field}
        {...props}
        dropDownClassName={cx({ 'dropdown--full-width': props.fullWidth })}
        onChange={(value: string) => setFieldValue(props.name, value)}
        onBlur={() => setFieldTouched(props.name, true)}
      />
      {helpText && <HelpBlock id={`${props.name}-help`}>{helpText}</HelpBlock>}
      {touched && error && <HelpBlock>{error}</HelpBlock>}
    </FormGroup>
  );
};

export default DropdownField;
