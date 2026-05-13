/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { Icon } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';

import selectors from '../../selectors';

import styles from './SwimLaneRail.module.scss';

const SwimLaneTypes = {
  STANDARD: 'standard',
  EXPEDITE: 'expedite',
};

// Expedite는 항상 최상단, 그 외 standard는 position 순으로
const sortLanes = (lanes) => {
  const expedite = lanes.filter((l) => l.type === SwimLaneTypes.EXPEDITE);
  const standard = lanes
    .filter((l) => l.type !== SwimLaneTypes.EXPEDITE)
    .slice()
    .sort((a, b) => a.position - b.position);
  return [...expedite, ...standard];
};

const SwimLaneRail = React.memo(() => {
  const [t] = useTranslation();

  const board = useSelector(selectors.selectCurrentBoard);
  const lanes = useSelector((state) => {
    if (!board) return [];
    return selectors.selectSwimLanesByBoardId(state, board.id) || [];
  });

  const sortedLanes = useMemo(() => sortLanes(lanes), [lanes]);

  if (!board || sortedLanes.length === 0) {
    return null;
  }

  return (
    <div className={styles.rail}>
      {sortedLanes.map((lane) => {
        const isExpedite = lane.type === SwimLaneTypes.EXPEDITE;
        const hasWipLimit = lane.wipLimit !== null && lane.wipLimit !== undefined;
        return (
          <div key={lane.id} className={classNames(styles.lane, isExpedite && styles.laneExpedite)}>
            <div className={styles.laneInfo}>
              {isExpedite && <Icon name="lightning" className={styles.expediteIcon} />}
              <span className={styles.laneName}>
                {isExpedite ? t('common.expediteLane', { defaultValue: 'Expedite' }) : lane.name}
              </span>
            </div>
            {hasWipLimit && (
              <span className={styles.wip}>
                {t('common.wipLimit', { defaultValue: 'WIP' })} {lane.wipLimit}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default SwimLaneRail;
