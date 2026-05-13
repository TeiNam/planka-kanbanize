/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Message } from 'semantic-ui-react';

const SystemWipLimitExceededToast = React.memo(() => {
  const [t] = useTranslation();

  return (
    <Message visible negative size="tiny">
      <Icon name="ban" />
      {t('common.systemWipLimitExceeded', {
        defaultValue: 'Total WIP limit reached. Move blocked.',
      })}
    </Message>
  );
});

export default SystemWipLimitExceededToast;
