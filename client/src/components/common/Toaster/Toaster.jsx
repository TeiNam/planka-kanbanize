/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import { Toaster as HotToaster, ToastBar as HotToastBar } from 'react-hot-toast';

import ToastTypes from '../../../constants/ToastTypes';
import FileIsTooBigToast from './FileIsTooBigToast';
import NotEnoughStorageToast from './NotEnoughStorageToast';
import EmptyTrashToast from './EmptyTrashToast';
import SourceCardNotCopyableToast from './SourceCardNotCopyableToast';
import SourceCardNotMovableToast from './SourceCardNotMovableToast';
import WipLimitExceededToast from './WipLimitExceededToast';
import WipLimitWarnToast from './WipLimitWarnToast';
import SystemWipLimitExceededToast from './SystemWipLimitExceededToast';
import SystemWipLimitWarnToast from './SystemWipLimitWarnToast';
import WipLimitSumExceedsSystemLimitToast from './WipLimitSumExceedsSystemLimitToast';
import CardHasActiveBlockersToast from './CardHasActiveBlockersToast';
import ExpediteLaneLimitExceededToast from './ExpediteLaneLimitExceededToast';

const TOAST_BY_TYPE = {
  [ToastTypes.FILE_IS_TOO_BIG]: FileIsTooBigToast,
  [ToastTypes.NOT_ENOUGH_STORAGE]: NotEnoughStorageToast,
  [ToastTypes.EMPTY_TRASH]: EmptyTrashToast,
  [ToastTypes.SOURCE_CARD_NOT_COPYABLE]: SourceCardNotCopyableToast,
  [ToastTypes.SOURCE_CARD_NOT_MOVABLE]: SourceCardNotMovableToast,
  [ToastTypes.WIP_LIMIT_EXCEEDED]: WipLimitExceededToast,
  [ToastTypes.WIP_LIMIT_WARN]: WipLimitWarnToast,
  [ToastTypes.SYSTEM_WIP_LIMIT_EXCEEDED]: SystemWipLimitExceededToast,
  [ToastTypes.SYSTEM_WIP_LIMIT_WARN]: SystemWipLimitWarnToast,
  [ToastTypes.WIP_LIMIT_SUM_EXCEEDS_SYSTEM_LIMIT]: WipLimitSumExceedsSystemLimitToast,
  [ToastTypes.CARD_HAS_ACTIVE_BLOCKERS]: CardHasActiveBlockersToast,
  [ToastTypes.EXPEDITE_LANE_LIMIT_EXCEEDED]: ExpediteLaneLimitExceededToast,
};

const Toaster = React.memo(() => (
  <HotToaster>
    {(toast) => (
      <HotToastBar
        toast={toast}
        style={{
          background: 'transparent',
          borderRadius: 0,
          maxWidth: '90%',
          padding: 0,
        }}
      >
        {() => {
          const Toast = TOAST_BY_TYPE[toast.message.type];

          // eslint-disable-next-line react/jsx-props-no-spreading
          return <Toast {...toast.message.params} id={toast.id} />;
        }}
      </HotToastBar>
    )}
  </HotToaster>
));

export default Toaster;
