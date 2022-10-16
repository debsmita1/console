import * as React from 'react';
import { css } from '@patternfly/react-styles';
import formStyles from '@patternfly/react-styles/css/components/Form/form';

const HorizontalFormLayout: React.FC<{}> = ({ children }) => {
  return <div className={css(formStyles.form, formStyles.modifiers.horizontal)}>{children}</div>;
};

export default HorizontalFormLayout;
