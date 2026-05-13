/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { Button, Icon } from 'semantic-ui-react';
import { usePopup } from '../../lib/popup';

import selectors from '../../selectors';
import { BoardMembershipRoles } from '../../constants/Enums';
import SwimLaneSettings from './SwimLaneSettings';

import styles from './SwimLaneHeader.module.scss';

// 스윔레인 타입 상수
const SwimLaneTypes = {
  STANDARD: 'standard',
  EXPEDITE: 'expedite',
};

const SwimLaneHeader = React.memo(({ swimLaneId }) => {
  const selectSwimLaneWipCount = useMemo(() => selectors.makeSelectSwimLaneWipCount(), []);
  const selectSwimLaneWipExceeded = useMemo(() => selectors.makeSelectSwimLaneWipExceeded(), []);

  const swimLane = useSelector((state) => {
    const { boardId } = selectors.selectPath(state);
    const allSwimLanes = selectors.selectSwimLanesByBoardId(state, boardId);
    return allSwimLanes ? allSwimLanes.find((sl) => sl.id === swimLaneId) : null;
  });

  const wipCount = useSelector((state) => selectSwimLaneWipCount(state, swimLaneId));
  const wipExceeded = useSelector((state) => selectSwimLaneWipExceeded(state, swimLaneId));

  const canEdit = useSelector((state) => {
    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const SettingsPopup = usePopup(SwimLaneSettings);

  if (!swimLane) {
    return null;
  }

  const isExpedite = swimLane.type === SwimLaneTypes.EXPEDITE;
  const hasWipLimit = swimLane.wipLimit !== null && swimLane.wipLimit !== undefined;

  return (
    <div
      className={classNames(
        styles.wrapper,
        wipExceeded && styles.wrapperExceeded,
        isExpedite && styles.wrapperExpedite,
      )}
    >
      <div className={styles.info}>
        {isExpedite && <Icon name="lightning" className={styles.expediteIcon} />}
        <span className={styles.name}>{swimLane.name}</span>
        {swimLane.category && <span className={styles.categoryBadge}>{swimLane.category}</span>}
      </div>
      <div className={styles.right}>
        {hasWipLimit && (
          <span
            className={classNames(styles.wipIndicator, wipExceeded && styles.wipIndicatorExceeded)}
          >
            {wipCount}/{swimLane.wipLimit}
          </span>
        )}
        {canEdit && (
          <SettingsPopup swimLaneId={swimLaneId}>
            <Button className={styles.settingsButton}>
              <Icon fitted name="setting" size="small" />
            </Button>
          </SettingsPopup>
        )}
      </div>
    </div>
  );
});

SwimLaneHeader.propTypes = {
  swimLaneId: PropTypes.string.isRequired,
};

export default SwimLaneHeader;
