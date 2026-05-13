/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { Button } from 'semantic-ui-react';
import { usePopup } from '../../lib/popup';

import selectors from '../../selectors';
import { BoardMembershipRoles } from '../../constants/Enums';
import CommitmentPointSettings from './CommitmentPointSettings';

import styles from './CommitmentPointLine.module.scss';

// Commitment Point 타입 상수
const CommitmentPointTypes = {
  COMMITMENT: 'commitment',
  DELIVERY: 'delivery',
};

const CommitmentPointLine = React.memo(({ commitmentPointId }) => {
  // 보드의 모든 Commitment Point에서 현재 CP 찾기
  const commitmentPoint = useSelector((state) => {
    const { boardId } = selectors.selectPath(state);
    const allCPs = selectors.selectCommitmentPointsByBoardId(state, boardId);
    return allCPs ? allCPs.find((cp) => cp.id === commitmentPointId) : null;
  });

  // 에디터 권한 확인
  const canEdit = useSelector((state) => {
    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const SettingsPopup = usePopup(CommitmentPointSettings);

  if (!commitmentPoint) {
    return null;
  }

  const isDelivery = commitmentPoint.type === CommitmentPointTypes.DELIVERY;

  // 라인 컨텐츠
  const lineContent = (
    <div
      className={classNames(
        styles.wrapper,
        isDelivery ? styles.wrapperDelivery : styles.wrapperCommitment,
      )}
    >
      <div className={styles.line} />
      {commitmentPoint.label && (
        <div className={styles.labelContainer}>
          <span className={styles.label}>{commitmentPoint.label}</span>
        </div>
      )}
      <div className={styles.typeIndicator}>
        <span className={styles.typeText}>{isDelivery ? 'D' : 'C'}</span>
      </div>
      <div className={styles.line} />
    </div>
  );

  // 에디터인 경우 클릭 시 설정 팝업 열기
  if (canEdit) {
    return (
      <SettingsPopup commitmentPointId={commitmentPointId}>
        <Button className={styles.triggerButton}>{lineContent}</Button>
      </SettingsPopup>
    );
  }

  return lineContent;
});

CommitmentPointLine.propTypes = {
  commitmentPointId: PropTypes.string.isRequired,
};

export default CommitmentPointLine;
